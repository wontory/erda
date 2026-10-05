use std::{sync::Arc, time::Duration};

use flyout::{BlurGuard, Dismiss, Flyout, HUD_LABEL, INSPECTOR_LABEL, PANEL_LABEL, TRAY_ID};
use tauri::{AppHandle, Manager, WindowEvent};
use window_vibrancy::{apply_acrylic, apply_blur};

const PANEL_GAP: f64 = 12.0;
const BLUR_GUARD: Duration = Duration::from_millis(250);
const TRAY_ICON: &[u8] = include_bytes!("../../../apps/desktop/src-tauri/icons/32x32.png");

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
    fn setup(&self, app: &AppHandle, on_dismiss: Dismiss) -> tauri::Result<()> {
        let window = app
            .get_webview_window(PANEL_LABEL)
            .ok_or(tauri::Error::WindowNotFound)?;
        apply_backdrop(&window);
        let handle = app.clone();
        let guard = self.guard.clone();
        window.on_window_event(move |event| {
            if let WindowEvent::Focused(false) = event {
                guard.note_blur();
                on_dismiss(&handle);
            }
        });
        Ok(())
    }

    fn show(&self, app: &AppHandle) {
        let Some(window) = window(app, PANEL_LABEL, "show") else {
            return;
        };
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

    fn set_tray_text(&self, app: &AppHandle, text: &str) {
        let Some(tray) = app.tray_by_id(TRAY_ID) else {
            return log::warn!("flyout-windows: set_tray_text: no `{TRAY_ID}` tray");
        };
        warn_on_err(
            tray.set_tooltip(Some(if text.is_empty() { "Erda" } else { text })),
            "tray set_tooltip",
        );
    }

    fn set_settings_mode(&self, _app: &AppHandle, _on: bool) {}

    fn tray_icon(&self) -> (&'static [u8], bool) {
        (TRAY_ICON, false)
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
