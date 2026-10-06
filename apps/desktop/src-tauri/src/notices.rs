use std::{
    collections::{BTreeMap, HashSet},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, AtomicI64, AtomicU64, Ordering},
        Arc,
    },
    time::Duration,
};

use nexon::CachePolicy;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

use crate::{
    data_file::{self, Contents},
    hud::{self, NoticeItem},
    nexon_cmd::GatewayState,
    runtime, settings_store, timers,
};

const POLL_INTERVAL: Duration = Duration::from_secs(600);
const POLL_CHECK: Duration = Duration::from_secs(30);
const MIN_GAP_MS: i64 = 60_000;
const MAX_ALERTS: usize = 5;
const FILE_NAME: &str = "notices.json";
const STALE_MESSAGE: &str = "오프라인이라 저장된 소식을 보여주고 있어요";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Category {
    Notice,
    Update,
    Event,
    Cashshop,
}

impl Category {
    const ALL: [Category; 4] = [Category::Notice, Category::Update, Category::Event, Category::Cashshop];

    fn path(self) -> &'static str {
        match self {
            Category::Notice => "/maplestory/v1/notice",
            Category::Update => "/maplestory/v1/notice-update",
            Category::Event => "/maplestory/v1/notice-event",
            Category::Cashshop => "/maplestory/v1/notice-cashshop",
        }
    }

    fn list_key(self) -> &'static str {
        match self {
            Category::Notice => "notice",
            Category::Update => "update_notice",
            Category::Event => "event_notice",
            Category::Cashshop => "cashshop_notice",
        }
    }

    fn key(self) -> &'static str {
        match self {
            Category::Notice => "notice",
            Category::Update => "update",
            Category::Event => "event",
            Category::Cashshop => "cashshop",
        }
    }

    fn title(self) -> &'static str {
        match self {
            Category::Notice => "공지",
            Category::Update => "업데이트",
            Category::Event => "이벤트",
            Category::Cashshop => "캐시샵",
        }
    }

    fn alerts(self) -> bool {
        !matches!(self, Category::Cashshop)
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoticeEntry {
    pub id: String,
    pub category: Category,
    pub notice_id: i64,
    pub title: String,
    pub url: String,
    pub date: String,
    pub start: Option<String>,
    pub end: Option<String>,
    pub ongoing: Option<bool>,
}

impl NoticeEntry {
    fn to_hud_item(&self) -> NoticeItem {
        NoticeItem {
            id: self.id.clone(),
            title: self.title.clone(),
            category: self.category.title().into(),
        }
    }
}

fn str_field(v: &Value, key: &str) -> Option<String> {
    v.get(key).and_then(Value::as_str).map(str::to_string)
}

fn parse_list(category: Category, body: &str) -> Result<Vec<NoticeEntry>, String> {
    let v: Value = serde_json::from_str(body).map_err(|e| format!("{} 응답을 읽지 못했어요: {e}", category.title()))?;
    let items = v
        .get(category.list_key())
        .and_then(Value::as_array)
        .ok_or_else(|| format!("{} 응답에 목록이 없어요", category.title()))?;
    Ok(items.iter().filter_map(|item| parse_entry(category, item)).collect())
}

fn parse_entry(category: Category, item: &Value) -> Option<NoticeEntry> {
    let raw = item.get("notice_id")?;
    let notice_id = raw.as_i64().or_else(|| raw.as_f64().map(|f| f as i64))?;
    let (start, end, ongoing) = match category {
        Category::Event => (
            str_field(item, "date_event_start"),
            str_field(item, "date_event_end"),
            None,
        ),
        Category::Cashshop => (
            str_field(item, "date_sale_start"),
            str_field(item, "date_sale_end"),
            Some(item.get("ongoing_flag").and_then(Value::as_str) == Some("true")),
        ),
        Category::Notice | Category::Update => (None, None, None),
    };
    Some(NoticeEntry {
        id: format!("{}-{notice_id}", category.key()),
        category,
        notice_id,
        title: str_field(item, "title").unwrap_or_default(),
        url: str_field(item, "url").unwrap_or_default(),
        date: str_field(item, "date").unwrap_or_default(),
        start,
        end,
        ongoing,
    })
}

fn empty_is_failure(prev: &[NoticeEntry], category: Category, list: &[NoticeEntry]) -> bool {
    list.is_empty() && prev.iter().any(|e| e.category == category)
}

fn merge(prev: &[NoticeEntry], fetched: &[(Category, Vec<NoticeEntry>)]) -> Vec<NoticeEntry> {
    let replaced: HashSet<Category> = fetched.iter().map(|(c, _)| *c).collect();
    let mut out: Vec<NoticeEntry> = prev
        .iter()
        .filter(|e| !replaced.contains(&e.category))
        .cloned()
        .collect();
    for (_, list) in fetched {
        out.extend(list.iter().cloned());
    }
    out
}

fn newest_dates(entries: &[NoticeEntry]) -> BTreeMap<&str, &str> {
    let mut newest: BTreeMap<&str, &str> = BTreeMap::new();
    for e in entries {
        let slot = newest.entry(e.category.key()).or_insert(e.date.as_str());
        if e.date.as_str() > *slot {
            *slot = e.date.as_str();
        }
    }
    newest
}

fn new_alerts(prev: &[NoticeEntry], next: &[NoticeEntry], seen: &HashSet<String>) -> Vec<NoticeEntry> {
    let before: HashSet<&str> = prev.iter().map(|e| e.id.as_str()).collect();
    let newest = newest_dates(prev);
    let mut fresh: Vec<NoticeEntry> = next
        .iter()
        .filter(|e| e.category.alerts() && !seen.contains(&e.id) && !before.contains(e.id.as_str()))
        .filter(|e| newest.get(e.category.key()).is_none_or(|d| e.date.as_str() >= *d))
        .cloned()
        .collect();
    fresh.sort_by(|a, b| b.date.cmp(&a.date));
    fresh.truncate(MAX_ALERTS);
    fresh
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct NoticeStore {
    cache: Vec<NoticeEntry>,
    seen: HashSet<String>,
    seeded: bool,
    seeded_categories: HashSet<Category>,
    updated_at: Option<i64>,
}

impl NoticeStore {
    fn mark_categories_seen(&mut self, categories: &[Category]) {
        let ids: Vec<String> = self
            .cache
            .iter()
            .filter(|e| categories.contains(&e.category))
            .map(|e| e.id.clone())
            .collect();
        self.seen.extend(ids);
    }
}

fn apply_fetch(
    store: &mut NoticeStore,
    fetched: &[(Category, Vec<NoticeEntry>)],
    now_ms: i64,
    fresh: bool,
) -> Vec<NoticeEntry> {
    if fetched.is_empty() {
        return Vec::new();
    }
    if store.seeded && store.seeded_categories.is_empty() {
        store.seeded_categories.extend(store.cache.iter().map(|e| e.category));
    }
    let next = merge(&store.cache, fetched);
    let mut fresh_categories = HashSet::new();
    for (category, list) in fetched {
        if !list.is_empty() && store.seeded_categories.insert(*category) {
            store.seen.extend(list.iter().map(|e| e.id.clone()));
            fresh_categories.insert(*category);
        }
    }
    store.seeded = true;
    let mut alerts = new_alerts(&store.cache, &next, &store.seen);
    alerts.retain(|e| !fresh_categories.contains(&e.category));
    let live: HashSet<&str> = next.iter().map(|e| e.id.as_str()).collect();
    store.seen.retain(|id| live.contains(id.as_str()));
    store.cache = next;
    if fresh {
        store.updated_at = Some(now_ms);
    }
    alerts
}

fn should_fetch(has_key: bool, force: bool, last_fetch_ms: i64, now_ms: i64) -> bool {
    has_key && (force || last_fetch_ms == 0 || now_ms - last_fetch_ms >= MIN_GAP_MS)
}

type FetchResult = Result<(Vec<NoticeEntry>, bool), String>;

#[derive(Debug, Default)]
struct FetchRound {
    fetched: Vec<(Category, Vec<NoticeEntry>)>,
    first_error: Option<String>,
    any_stale: bool,
}

impl FetchRound {
    fn collect(prev: &[NoticeEntry], results: impl IntoIterator<Item = (Category, FetchResult)>) -> Self {
        let mut round = FetchRound::default();
        for (category, result) in results {
            match result {
                Ok((list, _)) if empty_is_failure(prev, category, &list) => {
                    log::warn!(
                        "notices: {} list came back empty, keeping the previous one",
                        category.title()
                    );
                    round
                        .first_error
                        .get_or_insert(format!("{} 목록이 비어 있어요", category.title()));
                }
                Ok((list, stale)) => {
                    round.any_stale |= stale;
                    round.fetched.push((category, list));
                }
                Err(e) => {
                    log::warn!("notices: {} fetch failed: {e}", category.title());
                    round.first_error.get_or_insert(e);
                }
            }
        }
        if round.any_stale {
            round.first_error.get_or_insert_with(|| STALE_MESSAGE.to_string());
        }
        round
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NoticesSnapshot {
    entries: Vec<NoticeEntry>,
    seen: Vec<String>,
    updated_at: Option<i64>,
    last_error: Option<String>,
    loading: bool,
    has_key: bool,
    rev: u64,
}

pub struct NoticesState {
    store: Mutex<NoticeStore>,
    last_error: Mutex<Option<String>>,
    last_fetch_ms: AtomicI64,
    loading: AtomicBool,
    rev: AtomicU64,
    write_lock: Mutex<()>,
    file: PathBuf,
}

impl NoticesState {
    fn new(store: NoticeStore, file: PathBuf) -> Self {
        Self {
            store: Mutex::new(store),
            last_error: Mutex::new(None),
            last_fetch_ms: AtomicI64::new(0),
            loading: AtomicBool::new(false),
            rev: AtomicU64::new(0),
            write_lock: Mutex::new(()),
            file,
        }
    }
}

fn notices_state(app: &AppHandle) -> Arc<NoticesState> {
    app.state::<Arc<NoticesState>>().inner().clone()
}

struct LoadingGuard<'a>(&'a AtomicBool);

impl<'a> LoadingGuard<'a> {
    fn begin(flag: &'a AtomicBool) -> Option<Self> {
        (!flag.swap(true, Ordering::Relaxed)).then_some(Self(flag))
    }
}

impl Drop for LoadingGuard<'_> {
    fn drop(&mut self) {
        self.0.store(false, Ordering::Relaxed);
    }
}

async fn persist(state: &NoticesState) {
    let _guard = state.write_lock.lock().await;
    let json = match serde_json::to_string(&*state.store.lock().await) {
        Ok(j) => j,
        Err(e) => return log::warn!("notices.json serialize failed: {e}"),
    };
    data_file::write_in_background(state.file.clone(), json).await;
}

async fn snapshot(app: &AppHandle, state: &NoticesState) -> NoticesSnapshot {
    let has_key = !settings_store::api_key(app).is_empty();
    let store = state.store.lock().await;
    let rev = state.rev.fetch_add(1, Ordering::Relaxed) + 1;
    let mut seen: Vec<String> = store.seen.iter().cloned().collect();
    seen.sort();
    NoticesSnapshot {
        entries: store.cache.clone(),
        seen,
        updated_at: store.updated_at,
        last_error: state.last_error.lock().await.clone(),
        loading: state.loading.load(Ordering::Relaxed),
        has_key,
        rev,
    }
}

async fn emit(app: &AppHandle, state: &NoticesState) {
    let snap = snapshot(app, state).await;
    runtime::emit(app, "notices:updated", &snap);
}

pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    let file = data_file::in_app_data(app, FILE_NAME)?;
    let store = load_store(&file);
    app.manage(Arc::new(NoticesState::new(store, file)));
    spawn_polling(app.clone());
    Ok(())
}

fn load_store(file: &Path) -> NoticeStore {
    let Contents::Text(json) = data_file::read(file) else {
        return NoticeStore::default();
    };
    serde_json::from_str(&json).unwrap_or_else(|e| {
        log::warn!("notices.json is corrupt, starting empty: {e}");
        data_file::back_up_corrupt(file);
        NoticeStore::default()
    })
}

fn spawn_polling(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let interval_ms = POLL_INTERVAL.as_millis() as i64;
        loop {
            refresh(&app, false).await;
            let started = timers::now_ms();
            loop {
                tokio::time::sleep(POLL_CHECK).await;
                if timers::now_ms() - started >= interval_ms {
                    break;
                }
            }
        }
    });
}

async fn fetch_one(app: &AppHandle, key: &str, category: Category, policy: CachePolicy) -> FetchResult {
    let gateway = app.state::<GatewayState>();
    let (body, stale) = gateway
        .0
        .request_meta(key, category.path(), BTreeMap::new(), policy)
        .await
        .map_err(|e| e.to_string())?;
    Ok((parse_list(category, &body)?, stale))
}

async fn fetch_all(app: &AppHandle, key: &str, policy: CachePolicy) -> [(Category, FetchResult); 4] {
    let (notice, update, event, cashshop) = tokio::join!(
        fetch_one(app, key, Category::Notice, policy),
        fetch_one(app, key, Category::Update, policy),
        fetch_one(app, key, Category::Event, policy),
        fetch_one(app, key, Category::Cashshop, policy),
    );
    let [a, b, c, d] = Category::ALL;
    [(a, notice), (b, update), (c, event), (d, cashshop)]
}

async fn refresh(app: &AppHandle, force: bool) {
    let state = notices_state(app);
    let key = settings_store::api_key(app);
    let now = timers::now_ms();
    if !should_fetch(!key.is_empty(), force, state.last_fetch_ms.load(Ordering::Relaxed), now) {
        return emit(app, &state).await;
    }
    let Some(loading) = LoadingGuard::begin(&state.loading) else {
        return;
    };
    state.last_fetch_ms.store(now, Ordering::Relaxed);
    emit(app, &state).await;
    let policy = if force {
        CachePolicy::Refresh
    } else {
        CachePolicy::UseCache
    };
    let results = fetch_all(app, &key, policy).await;
    let (round, alerts) = {
        let mut store = state.store.lock().await;
        let round = FetchRound::collect(&store.cache, results);
        let alerts = apply_fetch(&mut store, &round.fetched, timers::now_ms(), !round.any_stale);
        (round, alerts)
    };
    if !round.fetched.is_empty() {
        persist(&state).await;
    }
    *state.last_error.lock().await = round.first_error;
    drop(loading);
    emit(app, &state).await;
    if !alerts.is_empty() {
        hud::notify(app, alerts.iter().map(NoticeEntry::to_hud_item).collect()).await;
    }
}

#[tauri::command]
pub async fn notices_snapshot(app: AppHandle) -> Result<NoticesSnapshot, String> {
    let state = notices_state(&app);
    Ok(snapshot(&app, &state).await)
}

#[tauri::command]
pub async fn notices_refresh(app: AppHandle, force: bool) -> Result<(), String> {
    refresh(&app, force).await;
    Ok(())
}

#[tauri::command]
pub async fn notices_mark_seen(app: AppHandle, ids: Vec<String>) -> Result<(), String> {
    let state = notices_state(&app);
    state.store.lock().await.seen.extend(ids);
    persist(&state).await;
    emit(&app, &state).await;
    Ok(())
}

#[tauri::command]
pub async fn notices_mark_all_seen(app: AppHandle, categories: Vec<Category>) -> Result<(), String> {
    let state = notices_state(&app);
    state.store.lock().await.mark_categories_seen(&categories);
    persist(&state).await;
    emit(&app, &state).await;
    Ok(())
}
