use std::{sync::Arc, time::Duration};

use flyout::{BlurGuard, Dismiss, Edge, Flyout, Point, Toggle, HUD_LABEL, INSPECTOR_LABEL, PANEL_LABEL};
use tauri::{AppHandle, Manager, WindowEvent};
use window_vibrancy::{apply_acrylic, apply_blur};

#[cfg(windows)]
mod taskbar;

const PANEL_GAP: f64 = 12.0;
const BLUR_GUARD: Duration = Duration::from_millis(250);

fn apply_backdrop(window: &tauri::WebviewWindow) {
    if let Err(acrylic_err) = apply_acrylic(window, Some((0, 0, 0, 40))) {
        log::warn!("flyout-windows: acrylic unavailable ({acrylic_err}); using blur");
        if let Err(e) = apply_blur(window, Some((0, 0, 0, 40))) {
            log::warn!("flyout-windows: apply_blur failed: {e}; window has no backdrop");
        }
    }
}

#[cfg(windows)]
fn set_shown_without_activation(window: &tauri::WebviewWindow, shown: bool) {
    use windows::Win32::UI::WindowsAndMessaging::{ShowWindow, SW_HIDE, SW_SHOWNOACTIVATE};
    match window.hwnd() {
        Ok(hwnd) => unsafe {
            let _ = ShowWindow(hwnd, if shown { SW_SHOWNOACTIVATE } else { SW_HIDE });
        },
        Err(e) => log::warn!("flyout-windows: window hwnd failed: {e}"),
    }
}

#[cfg(not(windows))]
fn set_shown_without_activation(window: &tauri::WebviewWindow, shown: bool) {
    let result = if shown { window.show() } else { window.hide() };
    if let Err(e) = result {
        log::warn!("flyout-windows: window show({shown}) failed: {e}");
    }
}

#[cfg(windows)]
fn add_taskbar_button(app: &AppHandle, on_click: Toggle) {
    taskbar::create(app, on_click);
}

#[cfg(not(windows))]
fn add_taskbar_button(_app: &AppHandle, _on_click: Toggle) {}

#[cfg(windows)]
fn set_taskbar_title(text: &str) {
    taskbar::set_title(text);
}

#[cfg(not(windows))]
fn set_taskbar_title(_text: &str) {}

#[cfg(windows)]
fn taskbar_button_is_foreground() -> bool {
    taskbar::is_foreground()
}

#[cfg(not(windows))]
fn taskbar_button_is_foreground() -> bool {
    false
}

#[cfg(windows)]
fn taskbar_position() -> Option<(Edge, i32)> {
    taskbar::position()
}

#[cfg(not(windows))]
fn taskbar_position() -> Option<(Edge, i32)> {
    None
}

fn anchor_to_taskbar(app: &AppHandle) {
    let cursor = match app.cursor_position() {
        Ok(p) => Point {
            x: p.x.round() as i32,
            y: p.y.round() as i32,
        },
        Err(e) => return log::warn!("flyout-windows: cursor_position failed: {e}; panel keeps its last anchor"),
    };
    let Some(monitor) = flyout::monitor_under_cursor(app) else {
        return log::warn!("flyout-windows: no monitor under the cursor; panel keeps its last anchor");
    };
    let Some((edge, thickness)) = taskbar_position() else {
        return log::warn!("flyout-windows: taskbar position unknown; panel keeps its last anchor");
    };
    if let Some(slot) = flyout::taskbar_slot(cursor, flyout::monitor_rect_of(&monitor), edge, thickness) {
        flyout::remember_anchor(app, slot);
    }
}

fn refocus_panel(app: &AppHandle) {
    let handle = app.clone();
    let result = app.run_on_main_thread(move || {
        if let Some(window) = window(&handle, PANEL_LABEL, "refocus") {
            warn_on_err(window.set_focus(), "refocus set_focus");
        }
    });
    if let Err(e) = result {
        log::warn!("flyout-windows: refocus: run_on_main_thread failed: {e}");
    }
}

pub struct WindowsFlyout {
    guard: Arc<BlurGuard>,
}

impl Default for WindowsFlyout {
    fn default() -> Self {
        Self {
            guard: Arc::new(BlurGuard::new(BLUR_GUARD)),
        }
    }
}

fn window(app: &AppHandle, label: &str, context: &str) -> Option<tauri::WebviewWindow> {
    let window = app.get_webview_window(label);
    if window.is_none() {
        log::warn!("flyout-windows: {context}: no `{label}` window");
    }
    window
}

fn warn_on_err(result: tauri::Result<()>, what: &str) {
    if let Err(e) = result {
        log::warn!("flyout-windows: {what} failed: {e}");
    }
}

impl Flyout for WindowsFlyout {
    fn setup(&self, app: &AppHandle, on_dismiss: Dismiss, on_toggle: Toggle) -> tauri::Result<()> {
        let window = app
            .get_webview_window(PANEL_LABEL)
            .ok_or(tauri::Error::WindowNotFound)?;
        apply_backdrop(&window);
        let handle = app.clone();
        let guard = self.guard.clone();
        window.on_window_event(move |event| {
            if let WindowEvent::Focused(false) = event {
                if taskbar_button_is_foreground() {
                    return refocus_panel(&handle);
                }
                guard.note_blur();
                on_dismiss(&handle);
            }
        });
        add_taskbar_button(app, on_toggle);
        Ok(())
    }

    fn show(&self, app: &AppHandle) {
        let Some(window) = window(app, PANEL_LABEL, "show") else {
            return;
        };
        anchor_to_taskbar(app);
        flyout::place_panel(app, &window, PANEL_GAP);
        warn_on_err(window.show(), "show");
        warn_on_err(window.set_focus(), "set_focus");
    }

    fn hide(&self, app: &AppHandle) {
        if let Some(window) = window(app, PANEL_LABEL, "hide") {
            warn_on_err(window.hide(), "hide");
        }
    }

    fn is_visible(&self, app: &AppHandle) -> bool {
        app.get_webview_window(PANEL_LABEL)
            .and_then(|w| w.is_visible().ok())
            .unwrap_or(false)
    }

    fn should_toggle_on_tray_click(&self) -> bool {
        self.guard.allows_toggle()
    }

    fn set_tray_text(&self, _app: &AppHandle, text: &str) {
        set_taskbar_title(text);
    }

    fn set_settings_mode(&self, _app: &AppHandle, _on: bool) {}

    fn tray_icon(&self) -> Option<(&'static [u8], bool)> {
        None
    }

    fn setup_inspector(&self, app: &AppHandle) -> tauri::Result<()> {
        let Some(window) = window(app, INSPECTOR_LABEL, "setup_inspector") else {
            return Ok(());
        };
        apply_backdrop(&window);
        warn_on_err(window.set_focusable(false), "inspector set_focusable(false)");
        Ok(())
    }

    fn show_inspector(&self, app: &AppHandle) {
        if let Some(window) = window(app, INSPECTOR_LABEL, "show_inspector") {
            set_shown_without_activation(&window, true);
        }
    }

    fn hide_inspector(&self, app: &AppHandle) {
        if let Some(window) = window(app, INSPECTOR_LABEL, "hide_inspector") {
            set_shown_without_activation(&window, false);
        }
    }

    fn setup_hud(&self, app: &AppHandle) -> tauri::Result<()> {
        let Some(window) = window(app, HUD_LABEL, "setup_hud") else {
            return Ok(());
        };
        warn_on_err(window.set_focusable(false), "hud set_focusable(false)");
        warn_on_err(window.set_ignore_cursor_events(true), "hud set_ignore_cursor_events");
        Ok(())
    }

    fn show_hud(&self, app: &AppHandle) {
        if let Some(window) = window(app, HUD_LABEL, "show_hud") {
            set_shown_without_activation(&window, true);
        }
    }

    fn hide_hud(&self, app: &AppHandle) {
        if let Some(window) = window(app, HUD_LABEL, "hide_hud") {
            set_shown_without_activation(&window, false);
        }
    }
}
