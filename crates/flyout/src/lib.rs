use std::{
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc, Mutex,
    },
    time::{Duration, Instant},
};

use tauri::{AppHandle, Manager, Monitor, PhysicalPosition, PhysicalSize, WebviewWindow};

pub const PANEL_LABEL: &str = "main";
pub const TRAY_ID: &str = "main";
pub const INSPECTOR_LABEL: &str = "inspector";
pub const HUD_LABEL: &str = "hud";
pub const HUD_WIDTH: f64 = 400.0;
pub const PANEL_SIZE: (f64, f64) = (400.0, 640.0);
const PANEL_MARGIN: f64 = 8.0;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Rect {
    pub x: i32,
    pub y: i32,
    pub w: i32,
    pub h: i32,
}

impl Rect {
    pub const fn new(x: i32, y: i32, w: i32, h: i32) -> Self {
        Rect { x, y, w, h }
    }

    pub fn from_physical(pos: PhysicalPosition<i32>, size: PhysicalSize<u32>) -> Self {
        Rect {
            x: pos.x,
            y: pos.y,
            w: size.width as i32,
            h: size.height as i32,
        }
    }

    fn center(self) -> Point {
        Point {
            x: self.x + self.w / 2,
            y: self.y + self.h / 2,
        }
    }

    fn contains(self, p: Point) -> bool {
        p.x >= self.x && p.x < self.x + self.w && p.y >= self.y && p.y < self.y + self.h
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Size {
    pub w: i32,
    pub h: i32,
}

impl From<PhysicalSize<u32>> for Size {
    fn from(size: PhysicalSize<u32>) -> Self {
        Size {
            w: size.width as i32,
            h: size.height as i32,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

pub fn to_physical(logical: f64, scale: f64) -> i32 {
    (logical * scale).round() as i32
}

pub fn hud_anchor(work_area: Rect, size: Size, top_gap: i32) -> Point {
    Point {
        x: work_area.x + (work_area.w - size.w) / 2,
        y: work_area.y + top_gap,
    }
}

fn monitors(app: &AppHandle) -> Vec<Monitor> {
    app.available_monitors().unwrap_or_else(|e| {
        log::warn!("flyout: available_monitors failed: {e}");
        Vec::new()
    })
}

fn monitor_containing(app: &AppHandle, p: Point) -> Option<Monitor> {
    monitors(app).into_iter().find(|m| monitor_rect_of(m).contains(p))
}

pub fn monitor_under_cursor(app: &AppHandle) -> Option<Monitor> {
    let by_cursor = match app.cursor_position() {
        Ok(p) => monitor_containing(
            app,
            Point {
                x: p.x.round() as i32,
                y: p.y.round() as i32,
            },
        ),
        Err(e) => {
            log::warn!("flyout: cursor_position failed: {e}; using the primary monitor");
            None
        }
    };
    by_cursor.or_else(|| match app.primary_monitor() {
        Ok(m) => m,
        Err(e) => {
            log::warn!("flyout: primary_monitor failed: {e}");
            None
        }
    })
}

#[derive(Default)]
pub struct TrayRect(pub Mutex<Option<Rect>>);

pub fn anchor_panel(tray: Rect, panel: Size, monitor: Rect, gap: i32, margin: i32) -> Point {
    let center = tray.center();
    let x = center.x - panel.w / 2;
    let y = if center.y < monitor.y + monitor.h / 2 {
        tray.y + tray.h + gap
    } else {
        tray.y - panel.h - gap
    };
    let clamp = |v: i32, lo: i32, hi: i32| v.min(hi).max(lo);
    Point {
        x: clamp(x, monitor.x + margin, monitor.x + monitor.w - panel.w - margin),
        y: clamp(y, monitor.y + margin, monitor.y + monitor.h - panel.h - margin),
    }
}

pub fn fallback_anchor(panel: Size, work_area: Rect, margin: i32) -> Point {
    Point {
        x: work_area.x + work_area.w - panel.w - margin,
        y: work_area.y + margin,
    }
}

pub fn anchor_beside(main: Rect, panel: Size, monitor: Rect, gap: i32, margin: i32) -> Point {
    let right_x = main.x + main.w + gap;
    let x = if right_x + panel.w + margin <= monitor.x + monitor.w {
        right_x
    } else {
        main.x - panel.w - gap
    };
    let x = x.max(monitor.x + margin);
    let max_y = monitor.y + monitor.h - panel.h - margin;
    let y = main.y.min(max_y).max(monitor.y + margin);
    Point { x, y }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Edge {
    Left,
    Top,
    Right,
    Bottom,
}

pub fn taskbar_slot(cursor: Point, monitor: Rect, edge: Edge, thickness: i32) -> Option<Rect> {
    let (band, slot) = match edge {
        Edge::Left => {
            let band = Rect::new(monitor.x, monitor.y, thickness, monitor.h);
            (band, Rect::new(band.x, cursor.y, band.w, 1))
        }
        Edge::Top => {
            let band = Rect::new(monitor.x, monitor.y, monitor.w, thickness);
            (band, Rect::new(cursor.x, band.y, 1, band.h))
        }
        Edge::Right => {
            let band = Rect::new(monitor.x + monitor.w - thickness, monitor.y, thickness, monitor.h);
            (band, Rect::new(band.x, cursor.y, band.w, 1))
        }
        Edge::Bottom => {
            let band = Rect::new(monitor.x, monitor.y + monitor.h - thickness, monitor.w, thickness);
            (band, Rect::new(cursor.x, band.y, 1, band.h))
        }
    };
    band.contains(cursor).then_some(slot)
}

pub fn remember_tray_rect(app: &AppHandle, rect: &tauri::Rect) {
    let pos = rect.position.to_physical::<f64>(1.0);
    let size = rect.size.to_physical::<f64>(1.0);
    remember_anchor(
        app,
        Rect {
            x: pos.x.round() as i32,
            y: pos.y.round() as i32,
            w: size.width.round() as i32,
            h: size.height.round() as i32,
        },
    );
}

pub fn remember_anchor(app: &AppHandle, rect: Rect) {
    if let Some(state) = app.try_state::<TrayRect>() {
        if let Ok(mut slot) = state.0.lock() {
            *slot = Some(rect);
        }
    }
}

fn remembered_tray_rect(app: &AppHandle) -> Option<Rect> {
    app.try_state::<TrayRect>()
        .and_then(|s| s.0.lock().ok().and_then(|slot| *slot))
}

pub fn work_area_rect(m: &Monitor) -> Rect {
    let area = m.work_area();
    Rect::from_physical(area.position, area.size)
}

pub fn monitor_rect_of(m: &Monitor) -> Rect {
    Rect::from_physical(*m.position(), *m.size())
}

fn panel_size(window: &WebviewWindow, scale: f64) -> Size {
    match window.outer_size() {
        Ok(s) => Size::from(s),
        Err(e) => {
            log::warn!("flyout: outer_size failed: {e}; using PANEL_SIZE");
            Size {
                w: to_physical(PANEL_SIZE.0, scale),
                h: to_physical(PANEL_SIZE.1, scale),
            }
        }
    }
}

pub fn place_panel(app: &AppHandle, window: &WebviewWindow, gap_pt: f64) {
    let remembered = remembered_tray_rect(app);
    let anchored = remembered.and_then(|t| monitor_containing(app, t.center()).map(|m| (t, m)));
    let (tray, monitor) = match anchored {
        Some((t, m)) => (Some(t), m),
        None => match app.primary_monitor() {
            Ok(Some(m)) => (None, m),
            Ok(None) => return log::warn!("flyout: no primary monitor; panel left where it is"),
            Err(e) => return log::warn!("flyout: primary_monitor failed: {e}; panel left where it is"),
        },
    };
    let scale = monitor.scale_factor();
    let panel = panel_size(window, scale);
    let margin = to_physical(PANEL_MARGIN, scale);
    let point = match tray {
        Some(t) => anchor_panel(t, panel, monitor_rect_of(&monitor), to_physical(gap_pt, scale), margin),
        None => {
            log::warn!("flyout: tray position unknown ({remembered:?}); placing panel at top-right of the work area");
            fallback_anchor(panel, work_area_rect(&monitor), margin)
        }
    };
    if let Err(e) = window.set_position(tauri::PhysicalPosition::new(point.x, point.y)) {
        log::warn!("flyout: set_position({point:?}) failed: {e}");
    }
}

pub type Dismiss = Arc<dyn Fn(&AppHandle) + Send + Sync>;
pub type Toggle = Arc<dyn Fn(&AppHandle) + Send + Sync>;

pub trait Flyout: Send + Sync {
    fn setup(&self, app: &AppHandle, on_dismiss: Dismiss, on_toggle: Toggle) -> tauri::Result<()>;
    fn show(&self, app: &AppHandle);
    fn hide(&self, app: &AppHandle);
    fn is_visible(&self, app: &AppHandle) -> bool;
    fn should_toggle_on_tray_click(&self) -> bool;
    fn set_tray_text(&self, app: &AppHandle, text: &str);
    fn set_settings_mode(&self, app: &AppHandle, on: bool);
    fn tray_icon(&self) -> Option<(&'static [u8], bool)>;
    fn setup_inspector(&self, app: &AppHandle) -> tauri::Result<()>;
    fn show_inspector(&self, app: &AppHandle);
    fn hide_inspector(&self, app: &AppHandle);
    fn setup_hud(&self, app: &AppHandle) -> tauri::Result<()>;
    fn show_hud(&self, app: &AppHandle);
    fn hide_hud(&self, app: &AppHandle);
}

pub struct BlurGuard {
    started: Instant,
    last_blur_ms: AtomicU64,
    window: Duration,
}

impl BlurGuard {
    pub fn new(window: Duration) -> Self {
        Self {
            started: Instant::now(),
            last_blur_ms: AtomicU64::new(0),
            window,
        }
    }

    fn now_ms(&self) -> u64 {
        self.started.elapsed().as_millis() as u64
    }

    pub fn note_blur(&self) {
        self.last_blur_ms.store(self.now_ms().max(1), Ordering::Relaxed);
    }

    pub fn allows_toggle(&self) -> bool {
        let last = self.last_blur_ms.load(Ordering::Relaxed);
        last == 0 || self.now_ms().saturating_sub(last) > self.window.as_millis() as u64
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const MONITOR: Rect = Rect::new(0, 0, 1920, 1080);

    #[test]
    fn slot_sits_in_a_bottom_taskbar_under_the_cursor() {
        let slot = taskbar_slot(Point { x: 700, y: 1060 }, MONITOR, Edge::Bottom, 48);
        assert_eq!(slot, Some(Rect::new(700, 1032, 1, 48)));
        let panel = Size { w: 400, h: 640 };
        let p = anchor_panel(slot.unwrap(), panel, MONITOR, 12, 8);
        assert_eq!((p.x, p.y), (500, 1032 - 640 - 12));
    }

    #[test]
    fn slot_follows_a_top_taskbar() {
        let slot = taskbar_slot(Point { x: 300, y: 20 }, MONITOR, Edge::Top, 48);
        assert_eq!(slot, Some(Rect::new(300, 0, 1, 48)));
    }

    #[test]
    fn no_slot_when_the_cursor_is_off_the_taskbar() {
        let slot = taskbar_slot(Point { x: 700, y: 500 }, MONITOR, Edge::Bottom, 48);
        assert_eq!(slot, None);
    }

    #[test]
    fn slot_uses_the_taskbar_on_a_second_monitor() {
        let second = Rect::new(1920, 5, 1920, 1080);
        let slot = taskbar_slot(Point { x: 2500, y: 1070 }, second, Edge::Bottom, 48);
        assert_eq!(slot, Some(Rect::new(2500, 1037, 1, 48)));
    }
}
