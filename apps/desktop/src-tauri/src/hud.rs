use std::{
    sync::{
        atomic::{AtomicBool, AtomicUsize, Ordering},
        Arc,
    },
    time::Duration,
};

use flyout::{HUD_LABEL, HUD_WIDTH};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewWindow};
use tokio::sync::Mutex;

use crate::{
    runtime,
    timers::{self, ActiveTimer, HudTimers, StartEntry},
    windows,
};

const NOTICE_TTL_MS: i64 = 8_000;
const MAX_ROWS: usize = 5;
const EXIT_DELAY: Duration = Duration::from_millis(280);
const SHRINK_DELAY: Duration = Duration::from_millis(450);
const SAMPLE_DELAY: Duration = Duration::from_secs(3);
const TOP_GAP: f64 = 16.0;
const ROW_H: i32 = 66;
const GAP: i32 = 12;
const PAD: i32 = 12;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct NoticeItem {
    pub id: String,
    pub title: String,
    pub category: String,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(tag = "kind", rename_all = "camelCase")]
enum HudRow {
    Timer {
        id: String,
        name: String,
        icon: String,
        color: String,
        remaining: u32,
    },
    Finished {
        id: String,
        name: String,
        icon: String,
        color: String,
    },
    Notice {
        id: String,
        title: String,
        category: String,
        maintenance: bool,
    },
}

impl HudRow {
    fn timer(t: &ActiveTimer, now_ms: i64) -> Self {
        HudRow::Timer {
            id: t.id.clone(),
            name: t.name.clone(),
            icon: t.icon.clone(),
            color: t.color.clone(),
            remaining: t.remaining_secs(now_ms).max(0.0).ceil() as u32,
        }
    }

    fn finished(t: &ActiveTimer) -> Self {
        HudRow::Finished {
            id: format!("done-{}", t.id),
            name: t.name.clone(),
            icon: t.icon.clone(),
            color: t.color.clone(),
        }
    }

    fn notice(n: &NoticeItem) -> Self {
        HudRow::Notice {
            id: format!("notice-{}", n.id),
            title: n.title.clone(),
            category: n.category.clone(),
            maintenance: is_maintenance(&n.title),
        }
    }
}

fn hud_height(rows: usize) -> i32 {
    if rows == 0 {
        return 0;
    }
    let n = rows as i32;
    2 * PAD + n * ROW_H + (n - 1) * GAP
}

fn is_maintenance(title: &str) -> bool {
    title.contains("점검")
}

fn build_rows(imminent: &[ActiveTimer], finished: &[ActiveTimer], notices: &[NoticeItem], now_ms: i64) -> Vec<HudRow> {
    imminent
        .iter()
        .map(|t| HudRow::timer(t, now_ms))
        .chain(finished.iter().rev().map(HudRow::finished))
        .chain(notices.iter().map(HudRow::notice))
        .take(MAX_ROWS)
        .collect()
}

struct PendingNotice {
    item: NoticeItem,
    expires_ms: i64,
}

pub struct HudState {
    notices: Mutex<Vec<PendingNotice>>,
    shown: AtomicBool,
    rows: AtomicUsize,
}

pub fn setup(app: &AppHandle) {
    app.manage(Arc::new(HudState {
        notices: Mutex::new(Vec::new()),
        shown: AtomicBool::new(false),
        rows: AtomicUsize::new(0),
    }));
}

fn hud_state(app: &AppHandle) -> Arc<HudState> {
    app.state::<Arc<HudState>>().inner().clone()
}

fn on_main(app: &AppHandle, f: impl FnOnce(&AppHandle) + Send + 'static) {
    runtime::on_main_thread(app, "hud", f);
}

pub async fn has_notices(app: &AppHandle) -> bool {
    !hud_state(app).notices.lock().await.is_empty()
}

fn hud_window(app: &AppHandle) -> Option<WebviewWindow> {
    let window = app.get_webview_window(HUD_LABEL);
    if window.is_none() {
        log::warn!("hud: no `{HUD_LABEL}` window");
    }
    window
}

fn resize_hud(app: &AppHandle, rows: usize) {
    let Some(window) = hud_window(app) else { return };
    if let Err(e) = window.set_size(tauri::LogicalSize::new(HUD_WIDTH, f64::from(hud_height(rows)))) {
        log::warn!("hud: set_size({rows} rows) failed: {e}");
    }
}

fn place_hud(app: &AppHandle, rows: usize) {
    let Some(window) = hud_window(app) else { return };
    let Some(monitor) = flyout::monitor_under_cursor(app) else {
        return log::warn!("hud: no monitor; HUD left where it is");
    };
    move_hud(&window, flyout::work_area_rect(&monitor), monitor.scale_factor(), rows);
}

#[cfg(target_os = "macos")]
fn move_hud(window: &WebviewWindow, work_area: flyout::Rect, scale: f64, _rows: usize) {
    let x = f64::from(work_area.x) / scale + (f64::from(work_area.w) / scale - HUD_WIDTH) / 2.0;
    let y = f64::from(work_area.y) / scale + TOP_GAP;
    if let Err(e) = window.set_position(tauri::LogicalPosition::new(x, y)) {
        log::warn!("hud: set_position({x}, {y}) failed: {e}");
    }
}

#[cfg(not(target_os = "macos"))]
fn move_hud(window: &WebviewWindow, work_area: flyout::Rect, scale: f64, rows: usize) {
    let size = flyout::Size {
        w: flyout::to_physical(HUD_WIDTH, scale),
        h: flyout::to_physical(f64::from(hud_height(rows)), scale),
    };
    let p = flyout::hud_anchor(work_area, size, flyout::to_physical(TOP_GAP, scale));
    if let Err(e) = window.set_position(tauri::PhysicalPosition::new(p.x, p.y)) {
        log::warn!("hud: set_position({p:?}) failed: {e}");
    }
}

async fn live_notices(state: &HudState, now_ms: i64) -> Vec<NoticeItem> {
    let mut pending = state.notices.lock().await;
    pending.retain(|n| n.expires_ms > now_ms);
    pending.iter().map(|n| n.item.clone()).collect()
}

pub async fn refresh(app: &AppHandle, timers: HudTimers, now_ms: i64) {
    let state = hud_state(app);
    let notices = live_notices(&state, now_ms).await;
    let rows = build_rows(&timers.imminent, &timers.finished, &notices, now_ms);
    runtime::emit_to(app, HUD_LABEL, "hud:rows", &rows);
    let count = rows.len();
    let prev = state.rows.swap(count, Ordering::Relaxed);
    if count == 0 {
        if state.shown.swap(false, Ordering::Relaxed) {
            schedule_hide(app);
        }
        return;
    }
    let first_show = !state.shown.swap(true, Ordering::Relaxed);
    if first_show {
        on_main(app, move |h| {
            resize_hud(h, count);
            place_hud(h, count);
            windows::show_hud(h);
        });
    } else if count > prev {
        on_main(app, move |h| resize_hud(h, count));
    } else if count < prev {
        schedule_shrink(app, count);
    }
}

fn schedule_hide(app: &AppHandle) {
    runtime::after(app, EXIT_DELAY, |app| async move {
        on_main(&app, |h| {
            if !hud_state(h).shown.load(Ordering::Relaxed) {
                windows::hide_hud(h);
            }
        });
    });
}

fn schedule_shrink(app: &AppHandle, count: usize) {
    runtime::after(app, SHRINK_DELAY, move |app| async move {
        on_main(&app, move |h| {
            let state = hud_state(h);
            if state.shown.load(Ordering::Relaxed) && state.rows.load(Ordering::Relaxed) == count {
                resize_hud(h, count);
            }
        });
    });
}

pub async fn notify(app: &AppHandle, items: Vec<NoticeItem>) {
    let expires_ms = timers::now_ms() + NOTICE_TTL_MS;
    {
        let state = hud_state(app);
        let mut pending = state.notices.lock().await;
        for item in items {
            pending.retain(|existing| existing.item.id != item.id);
            pending.push(PendingNotice { item, expires_ms });
        }
    }
    timers::publish(app, &timers::timers_state(app)).await;
}

pub fn show_sample_after_launch(app: &AppHandle) {
    runtime::after(app, SAMPLE_DELAY, |app| async move {
        let entry = StartEntry {
            name: "HUD 견본".into(),
            short_name: "견본".into(),
            icon: "Sun".into(),
            color: "orange".into(),
            seconds: 8,
            repeats: false,
        };
        if let Err(e) = timers::timers_start(app.clone(), entry).await {
            log::warn!("dev hud sample: timers_start failed: {e}");
        }
        let notice = NoticeItem {
            id: "sample".into(),
            title: "[점검] 견본 점검 공지".into(),
            category: "공지".into(),
        };
        notify(&app, vec![notice]).await;
    });
}
