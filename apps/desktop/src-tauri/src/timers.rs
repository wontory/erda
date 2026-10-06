use std::{
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc,
    },
    time::Duration,
};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tokio::sync::{Mutex, Notify};

use crate::{
    data_file::{self, Contents},
    duck, hud, runtime, settings_store,
    sound::{self, Sound},
    tray,
};

const RECENT_KEEP_MS: i64 = 1500;
const MAX_COMPLETED: usize = 50;
const TICK: Duration = Duration::from_secs(1);
const FILE_NAME: &str = "timers.json";

fn period_ms(seconds: u32) -> i64 {
    i64::from(seconds) * 1000
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ActiveTimer {
    pub id: String,
    pub name: String,
    pub short_name: String,
    pub icon: String,
    pub color: String,
    pub start_ms: i64,
    pub end_ms: i64,
    pub seconds: u32,
    pub repeats: bool,
}

impl ActiveTimer {
    pub fn remaining_secs(&self, now_ms: i64) -> f64 {
        (self.end_ms - now_ms) as f64 / 1000.0
    }

    fn has_ended(&self, now_ms: i64) -> bool {
        self.end_ms <= now_ms
    }

    fn roll_over(&mut self, now_ms: i64) -> bool {
        let Some(end_ms) = next_cycle(self.end_ms, self.seconds, now_ms) else {
            return false;
        };
        self.end_ms = end_ms;
        self.start_ms = end_ms - period_ms(self.seconds);
        true
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CompletedTimer {
    pub timer: ActiveTimer,
    pub finished_ms: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TimersSnapshot {
    pub now_ms: i64,
    pub active: Vec<ActiveTimer>,
    pub completed: Vec<CompletedTimer>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartEntry {
    pub name: String,
    pub short_name: String,
    pub icon: String,
    pub color: String,
    pub seconds: u32,
    pub repeats: bool,
}

impl StartEntry {
    fn rerun_once(timer: ActiveTimer) -> Self {
        Self {
            name: timer.name,
            short_name: timer.short_name,
            icon: timer.icon,
            color: timer.color,
            seconds: timer.seconds,
            repeats: false,
        }
    }
}

fn next_cycle(end_ms: i64, seconds: u32, now_ms: i64) -> Option<i64> {
    let period = period_ms(seconds.max(1));
    if end_ms > now_ms {
        return Some(end_ms);
    }
    let missed = now_ms.checked_sub(end_ms)?.checked_div(period)?.checked_add(1)?;
    end_ms.checked_add(missed.checked_mul(period)?)
}

fn nearest_text(active: &[ActiveTimer], now_ms: i64) -> String {
    active
        .iter()
        .min_by_key(|t| t.end_ms)
        .map(|t| format!("{} {}", t.short_name, clock(t.remaining_secs(now_ms))))
        .unwrap_or_default()
}

fn clock(seconds: f64) -> String {
    let total = seconds.max(0.0).ceil() as i64;
    let (h, m, s) = (total / 3600, (total % 3600) / 60, total % 60);
    if h > 0 {
        format!("{h}:{m:02}:{s:02}")
    } else {
        format!("{m:02}:{s:02}")
    }
}

#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Engine {
    active: Vec<ActiveTimer>,
    #[serde(skip)]
    completed: Vec<CompletedTimer>,
    #[serde(skip)]
    recently_finished: Vec<CompletedTimer>,
}

#[derive(Debug, Default)]
struct TickOutcome {
    finished: Vec<ActiveTimer>,
    changed: bool,
}

#[derive(Debug, Default)]
pub struct HudTimers {
    pub imminent: Vec<ActiveTimer>,
    pub finished: Vec<ActiveTimer>,
}

impl HudTimers {
    fn card_visible(&self) -> bool {
        !self.imminent.is_empty() || !self.finished.is_empty()
    }
}

fn push_completed(completed: &mut Vec<CompletedTimer>, timer: ActiveTimer, finished_ms: i64) {
    completed.insert(0, CompletedTimer { timer, finished_ms });
    completed.truncate(MAX_COMPLETED);
}

fn remember_finished(recent: &mut Vec<CompletedTimer>, timer: &ActiveTimer, finished_ms: i64) {
    recent.retain(|c| c.timer.id != timer.id);
    recent.push(CompletedTimer {
        timer: timer.clone(),
        finished_ms,
    });
}

impl Engine {
    fn load_json(json: &str, now_ms: i64) -> (Self, bool) {
        let (mut engine, corrupt) = Self::parse(json);
        engine.settle_after_restart(now_ms);
        (engine, corrupt)
    }

    fn parse(json: &str) -> (Self, bool) {
        match serde_json::from_str::<Engine>(json) {
            Ok(engine) => (engine, false),
            Err(e) => {
                let corrupt = !json.trim().is_empty();
                if corrupt {
                    log::warn!("timers.json is corrupt, starting empty: {e}");
                }
                (Engine::default(), corrupt)
            }
        }
    }

    fn settle_after_restart(&mut self, now_ms: i64) {
        let (ended, mut active): (Vec<_>, Vec<_>) = std::mem::take(&mut self.active)
            .into_iter()
            .partition(|t| !t.repeats && t.has_ended(now_ms));
        active.retain_mut(|t| {
            if !t.has_ended(now_ms) || t.roll_over(now_ms) {
                return true;
            }
            log::warn!("timers: dropping timer {} with an out-of-range end time", t.id);
            false
        });
        self.active = active;
        let mut completed: Vec<_> = ended
            .into_iter()
            .map(|t| CompletedTimer {
                finished_ms: t.end_ms,
                timer: t,
            })
            .collect();
        completed.sort_by_key(|c| std::cmp::Reverse(c.finished_ms));
        completed.truncate(MAX_COMPLETED);
        self.completed = completed;
        self.sort();
    }

    fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_else(|_| "{\"active\":[]}".into())
    }

    fn sort(&mut self) {
        self.active.sort_by_key(|t| t.end_ms);
    }

    fn start(&mut self, id: String, e: StartEntry, now_ms: i64) -> ActiveTimer {
        let seconds = e.seconds.max(1);
        let t = ActiveTimer {
            id,
            name: e.name,
            short_name: e.short_name,
            icon: e.icon,
            color: e.color,
            start_ms: now_ms,
            end_ms: now_ms + period_ms(seconds),
            seconds,
            repeats: e.repeats,
        };
        self.active.push(t.clone());
        self.sort();
        t
    }

    fn tick(&mut self, now_ms: i64) -> TickOutcome {
        let before = self.recently_finished.len();
        self.recently_finished
            .retain(|c| now_ms - c.finished_ms < RECENT_KEEP_MS);
        let expired_recent = self.recently_finished.len() != before;

        let mut finished = Vec::new();
        let Engine {
            active,
            completed,
            recently_finished,
        } = self;
        active.retain_mut(|t| {
            if !t.has_ended(now_ms) {
                return true;
            }
            finished.push(t.clone());
            remember_finished(recently_finished, t, now_ms);
            if !t.repeats {
                push_completed(completed, t.clone(), now_ms);
                return false;
            }
            if t.roll_over(now_ms) {
                return true;
            }
            log::warn!(
                "timers: dropping repeating timer {} with an out-of-range end time",
                t.id
            );
            false
        });
        self.sort();
        TickOutcome {
            changed: expired_recent || !finished.is_empty(),
            finished,
        }
    }

    fn hud_timers(&self, now_ms: i64, overlay_seconds: i64) -> HudTimers {
        let imminent = if overlay_seconds <= 0 {
            vec![]
        } else {
            self.active
                .iter()
                .filter(|t| t.remaining_secs(now_ms) <= overlay_seconds as f64)
                .cloned()
                .collect()
        };
        let finished = self.recently_finished.iter().map(|c| c.timer.clone()).collect();
        HudTimers { imminent, finished }
    }

    fn snapshot(&self, now_ms: i64) -> TimersSnapshot {
        TimersSnapshot {
            now_ms,
            active: self.active.clone(),
            completed: self.completed.clone(),
        }
    }

    fn needs_tick(&self) -> bool {
        !self.active.is_empty() || !self.recently_finished.is_empty()
    }

    fn cancel(&mut self, id: &str) {
        self.active.retain(|t| t.id != id);
    }

    fn set_repeat(&mut self, id: &str, repeats: bool) {
        if let Some(t) = self.active.iter_mut().find(|t| t.id == id) {
            t.repeats = repeats;
        }
    }

    fn take_completed(&mut self, id: &str) -> Option<CompletedTimer> {
        let pos = self.completed.iter().position(|c| c.timer.id == id)?;
        Some(self.completed.remove(pos))
    }

    fn dismiss_completed(&mut self, id: &str) {
        self.completed.retain(|c| c.timer.id != id);
    }
}

#[derive(Default)]
struct TrayText(std::sync::Mutex<Option<String>>);

impl TrayText {
    fn replace(&self, text: &str) -> bool {
        match self.0.lock() {
            Ok(last) if last.as_deref() == Some(text) => false,
            Ok(mut last) => {
                *last = Some(text.to_string());
                true
            }
            Err(_) => true,
        }
    }

    fn forget(&self) {
        if let Ok(mut last) = self.0.lock() {
            *last = None;
        }
    }
}

pub struct TimersState {
    engine: Mutex<Engine>,
    wake: Notify,
    counter: AtomicU64,
    file: PathBuf,
    write_lock: Mutex<()>,
    tray_text: TrayText,
}

impl TimersState {
    fn new(engine: Engine, file: PathBuf) -> Self {
        Self {
            engine: Mutex::new(engine),
            wake: Notify::new(),
            counter: AtomicU64::new(0),
            file,
            write_lock: Mutex::new(()),
            tray_text: TrayText::default(),
        }
    }

    fn new_id(&self) -> String {
        format!("{}-{}", now_ms(), self.counter.fetch_add(1, Ordering::Relaxed))
    }
}

pub fn now_ms() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    let file = data_file::in_app_data(app, FILE_NAME)?;
    let engine = load_engine(&file);
    app.manage(Arc::new(TimersState::new(engine, file)));
    spawn_loop(app.clone());
    Ok(())
}

fn load_engine(file: &Path) -> Engine {
    let (json, unreadable) = match data_file::read(file) {
        Contents::Text(json) => (json, false),
        Contents::Missing => (String::new(), false),
        Contents::Unreadable => (String::new(), true),
    };
    let (engine, corrupt) = Engine::load_json(&json, now_ms());
    if corrupt || unreadable {
        data_file::back_up_corrupt(file);
    } else if !json.trim().is_empty() {
        data_file::write(file, &engine.to_json());
    }
    engine
}

fn duck_prepare_in(active: &[ActiveTimer], now_ms: i64, overlay_seconds: i64) -> Option<Duration> {
    let lead = duck::PREPARE_LEAD.as_secs_f64();
    active
        .iter()
        .map(|t| t.remaining_secs(now_ms) - overlay_seconds.max(0) as f64 - lead)
        .filter(|wait| *wait < 1.0)
        .fold(None, |acc: Option<f64>, w| Some(acc.map_or(w, |a| a.min(w))))
        .map(|w| Duration::from_secs_f64(w.max(0.0)))
}

struct Frame {
    outcome: TickOutcome,
    counting: bool,
    card_visible: bool,
    prepare_in: Option<Duration>,
}

async fn has_work(app: &AppHandle, state: &TimersState) -> bool {
    let engine_busy = state.engine.lock().await.needs_tick();
    engine_busy || hud::has_notices(app).await
}

async fn advance(app: &AppHandle, state: &TimersState, now: i64) -> Frame {
    let overlay = settings_store::timer_overlay_seconds(app);
    let mut engine = state.engine.lock().await;
    let outcome = engine.tick(now);
    let hud_timers = engine.hud_timers(now, overlay);
    Frame {
        outcome,
        counting: !hud_timers.imminent.is_empty(),
        card_visible: hud_timers.card_visible(),
        prepare_in: duck_prepare_in(&engine.active, now, overlay),
    }
}

fn drive_ducking(app: &AppHandle, frame: &Frame, card_was_visible: bool) {
    let enabled = sound::ducking_enabled(app);
    if enabled && frame.card_visible {
        duck::hold(duck::HOLD);
    } else if card_was_visible {
        duck::release();
    } else if let (true, Some(wait)) = (enabled, frame.prepare_in) {
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(wait).await;
            duck::prepare(duck::PREPARE_LEAD + TICK);
        });
    }
}

fn play_frame_sound(app: &AppHandle, frame: &Frame) {
    if !frame.outcome.finished.is_empty() {
        sound::play_if_enabled(app, Sound::Finish);
    } else if frame.counting {
        sound::play_if_enabled(app, Sound::Tick);
    }
}

fn spawn_loop(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let state = timers_state(&app);
        let mut card_was_visible = false;
        loop {
            if !has_work(&app, &state).await {
                state.wake.notified().await;
                continue;
            }
            tokio::time::sleep(TICK).await;
            let frame = advance(&app, &state, now_ms()).await;
            drive_ducking(&app, &frame, card_was_visible);
            card_was_visible = frame.card_visible;
            play_frame_sound(&app, &frame);
            if frame.outcome.changed {
                persist(&state).await;
            }
            publish(&app, &state).await;
        }
    });
}

async fn persist(state: &TimersState) {
    let _guard = state.write_lock.lock().await;
    let json = { state.engine.lock().await.to_json() };
    data_file::write_in_background(state.file.clone(), json).await;
}

pub async fn publish(app: &AppHandle, state: &TimersState) {
    let now = now_ms();
    let overlay = settings_store::timer_overlay_seconds(app);
    let (snapshot, text, hud_timers) = {
        let engine = state.engine.lock().await;
        (
            engine.snapshot(now),
            nearest_text(&engine.active, now),
            engine.hud_timers(now, overlay),
        )
    };
    runtime::emit(app, "timers:tick", &snapshot);
    update_tray_text(app, state, text);
    hud::refresh(app, hud_timers, now).await;
    state.wake.notify_one();
}

fn update_tray_text(app: &AppHandle, state: &TimersState, text: String) {
    if !state.tray_text.replace(&text) {
        return;
    }
    let handle = app.clone();
    if let Err(e) = app.run_on_main_thread(move || tray::set_text(&handle, &text)) {
        log::warn!("tray text: run_on_main_thread failed: {e}");
        state.tray_text.forget();
    }
}

pub fn timers_state(app: &AppHandle) -> Arc<TimersState> {
    app.state::<Arc<TimersState>>().inner().clone()
}

async fn save_and_publish(app: &AppHandle, state: &TimersState) {
    persist(state).await;
    publish(app, state).await;
}

#[tauri::command]
pub async fn timers_start(app: AppHandle, entry: StartEntry) -> Result<ActiveTimer, String> {
    let state = timers_state(&app);
    let started = { state.engine.lock().await.start(state.new_id(), entry, now_ms()) };
    save_and_publish(&app, &state).await;
    Ok(started)
}

#[tauri::command]
pub async fn timers_start_group(app: AppHandle, entries: Vec<StartEntry>) -> Result<Vec<ActiveTimer>, String> {
    let state = timers_state(&app);
    let now = now_ms();
    let started = {
        let mut engine = state.engine.lock().await;
        entries
            .into_iter()
            .map(|entry| engine.start(state.new_id(), entry, now))
            .collect()
    };
    save_and_publish(&app, &state).await;
    Ok(started)
}

#[tauri::command]
pub async fn timers_cancel(app: AppHandle, id: String) -> Result<(), String> {
    let state = timers_state(&app);
    state.engine.lock().await.cancel(&id);
    save_and_publish(&app, &state).await;
    Ok(())
}

#[tauri::command]
pub async fn timers_cancel_all(app: AppHandle) -> Result<(), String> {
    let state = timers_state(&app);
    state.engine.lock().await.active.clear();
    save_and_publish(&app, &state).await;
    Ok(())
}

#[tauri::command]
pub async fn timers_set_repeat(app: AppHandle, id: String, repeats: bool) -> Result<(), String> {
    let state = timers_state(&app);
    state.engine.lock().await.set_repeat(&id, repeats);
    save_and_publish(&app, &state).await;
    Ok(())
}

#[tauri::command]
pub async fn timers_restart(app: AppHandle, id: String) -> Result<Option<ActiveTimer>, String> {
    let state = timers_state(&app);
    let restarted = {
        let mut engine = state.engine.lock().await;
        let Some(done) = engine.take_completed(&id) else {
            return Ok(None);
        };
        engine.start(state.new_id(), StartEntry::rerun_once(done.timer), now_ms())
    };
    save_and_publish(&app, &state).await;
    Ok(Some(restarted))
}

#[tauri::command]
pub async fn timers_dismiss_completed(app: AppHandle, id: String) -> Result<(), String> {
    let state = timers_state(&app);
    state.engine.lock().await.dismiss_completed(&id);
    publish(&app, &state).await;
    Ok(())
}

#[tauri::command]
pub async fn timers_dismiss_all_completed(app: AppHandle) -> Result<(), String> {
    let state = timers_state(&app);
    state.engine.lock().await.completed.clear();
    publish(&app, &state).await;
    Ok(())
}

#[tauri::command]
pub async fn timers_snapshot(app: AppHandle) -> Result<TimersSnapshot, String> {
    let state = timers_state(&app);
    let snapshot = state.engine.lock().await.snapshot(now_ms());
    Ok(snapshot)
}
