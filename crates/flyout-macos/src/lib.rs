#![cfg(target_os = "macos")]

use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    time::Duration,
};

use flyout::{BlurGuard, Dismiss, Flyout, Toggle, HUD_LABEL, INSPECTOR_LABEL, PANEL_LABEL, SHEET_LABEL, TRAY_ID};
use objc2_app_kit::NSView;
use tauri::{AppHandle, Manager};
use tauri_nspanel::{CollectionBehavior, ManagerExt, PanelHandle, PanelLevel, StyleMask, WebviewWindowExt};
use window_vibrancy::{
    apply_liquid_glass, apply_vibrancy, LiquidGlassOptions, NSGlassEffectViewStyle, NSVisualEffectMaterial,
    NSVisualEffectState,
};

const PANEL_RADIUS: f64 = 24.0;
const PANEL_GAP: f64 = 6.0;
const BLUR_GUARD: Duration = Duration::from_millis(250);
const TRAY_ICON: &[u8] = include_bytes!("../../../apps/desktop/src-tauri/icons/tray@2x.png");

mod panel {
    #![allow(clippy::unused_unit)]
    use tauri_nspanel::tauri_panel;

    tauri_panel! {
        panel!(MenuPanel {
            config: {
                can_become_key_window: true,
                can_become_main_window: false,
                is_floating_panel: true
            }
        })
        panel_event!(MenuPanelEvents {
            window_did_resign_key(notification: &NSNotification) -> ()
        })
    }

    pub(super) fn on_resign_key(panel: &tauri_nspanel::PanelHandle<tauri::Wry>, on_resign: impl Fn() + 'static) {
        let events = MenuPanelEvents::new();
        events.window_did_resign_key(move |_| on_resign());
        panel.set_event_handler(Some(events.as_ref()));
    }
}
use panel::MenuPanel;

mod inspector_panel {
    use tauri_nspanel::tauri_panel;

    tauri_panel! {
        panel!(InspectorPanel {
            config: {
                can_become_key_window: false,
                can_become_main_window: false,
                is_floating_panel: true
            }
        })
    }
}
use inspector_panel::InspectorPanel;

mod sheet_panel {
    #![allow(clippy::unused_unit)]
    use tauri_nspanel::tauri_panel;

    tauri_panel! {
        panel!(SheetPanel {
            config: {
                can_become_key_window: true,
                can_become_main_window: false,
                is_floating_panel: true
            }
        })
        panel_event!(SheetPanelEvents {
            window_did_resign_key(notification: &NSNotification) -> ()
        })
    }

    pub(super) fn on_resign_key(panel: &tauri_nspanel::PanelHandle<tauri::Wry>, on_resign: impl Fn() + 'static) {
        let events = SheetPanelEvents::new();
        events.window_did_resign_key(move |_| on_resign());
        panel.set_event_handler(Some(events.as_ref()));
    }
}
use sheet_panel::SheetPanel;

mod hud_panel {
    use tauri_nspanel::tauri_panel;

    tauri_panel! {
        panel!(HudPanel {
            config: {
                can_become_key_window: false,
                can_become_main_window: false,
                is_floating_panel: true
            }
        })
    }
}
use hud_panel::HudPanel;

pub fn plugin<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri_nspanel::init()
}

pub struct MacFlyout {
    refresh_shadow: AtomicBool,
    refresh_inspector_shadow: AtomicBool,
    refresh_sheet_shadow: AtomicBool,
    guard: Arc<BlurGuard>,
}

impl Default for MacFlyout {
    fn default() -> Self {
        Self {
            refresh_shadow: AtomicBool::new(false),
            refresh_inspector_shadow: AtomicBool::new(false),
            refresh_sheet_shadow: AtomicBool::new(false),
            guard: Arc::new(BlurGuard::new(BLUR_GUARD)),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Glass {
    Liquid,
    Vibrancy,
    None,
}

fn apply_glass(window: &tauri::WebviewWindow, radius: f64) -> Glass {
    let liquid = apply_liquid_glass(
        window,
        LiquidGlassOptions::new(NSGlassEffectViewStyle::Regular)
            .radius(radius)
            .opaque(false),
    );
    match liquid {
        Ok(()) => Glass::Liquid,
        Err(liquid_err) => {
            log::warn!("flyout-macos: liquid glass unavailable ({liquid_err}); using popover vibrancy");
            match apply_vibrancy(
                window,
                NSVisualEffectMaterial::Popover,
                Some(NSVisualEffectState::Active),
                Some(radius),
            ) {
                Ok(()) => Glass::Vibrancy,
                Err(e) => {
                    log::warn!("flyout-macos: apply_vibrancy failed: {e}; panel has no glass");
                    Glass::None
                }
            }
        }
    }
}

fn clip_to_radius(window: &tauri::WebviewWindow, radius: f64) {
    let ptr = match window.ns_view() {
        Ok(ptr) if !ptr.is_null() => ptr,
        Ok(_) => return log::warn!("flyout-macos: clip_to_radius: null content view"),
        Err(e) => return log::warn!("flyout-macos: clip_to_radius: ns_view failed: {e}"),
    };
    let view: &NSView = unsafe { &*(ptr as *const NSView) };
    view.setWantsLayer(true);
    match view.layer() {
        Some(layer) => {
            layer.setCornerRadius(radius);
            layer.setMasksToBounds(true);
        }
        None => log::warn!("flyout-macos: clip_to_radius: content view has no layer"),
    }
}

fn glaze(window: &tauri::WebviewWindow) -> bool {
    match apply_glass(window, PANEL_RADIUS) {
        Glass::Liquid => {
            if let Err(e) = window.set_shadow(false) {
                log::warn!("flyout-macos: set_shadow(false) failed: {e}");
            }
            clip_to_radius(window, PANEL_RADIUS);
            false
        }
        Glass::Vibrancy => {
            clip_to_radius(window, PANEL_RADIUS);
            true
        }
        Glass::None => true,
    }
}

fn refresh_shadow_once(window: &tauri::WebviewWindow, pending: &AtomicBool) {
    if pending.swap(false, Ordering::Relaxed) {
        for on in [false, true] {
            if let Err(e) = window.set_shadow(on) {
                log::warn!("flyout-macos: set_shadow({on}) failed: {e}");
            }
        }
    }
}

fn configure_panel(panel: &PanelHandle<tauri::Wry>, level: PanelLevel) -> tauri::Result<()> {
    panel.set_level(level.value());
    panel.set_collection_behavior(
        CollectionBehavior::new()
            .can_join_all_spaces()
            .stationary()
            .full_screen_auxiliary()
            .ignores_cycle()
            .value(),
    );
    panel
        .add_style_mask(StyleMask::empty().nonactivating_panel().value())
        .map_err(|e| tauri::Error::Anyhow(anyhow::anyhow!("nonactivating panel: {e}")))
}

fn window(app: &AppHandle, label: &str, context: &str) -> Option<tauri::WebviewWindow> {
    let window = app.get_webview_window(label);
    if window.is_none() {
        log::warn!("flyout-macos: {context}: no `{label}` window");
    }
    window
}

fn with_panel(app: &AppHandle, label: &str, context: &str, f: impl FnOnce(&PanelHandle<tauri::Wry>)) -> bool {
    match app.get_webview_panel(label) {
        Ok(panel) => {
            f(&panel);
            true
        }
        Err(e) => {
            log::warn!("flyout-macos: {context}: no panel for `{label}`: {e:?}");
            false
        }
    }
}

impl Flyout for MacFlyout {
    fn setup(&self, app: &AppHandle, on_dismiss: Dismiss, _on_toggle: Toggle) -> tauri::Result<()> {
        let window = app
            .get_webview_window(PANEL_LABEL)
            .ok_or(tauri::Error::WindowNotFound)?;
        self.refresh_shadow.store(glaze(&window), Ordering::Relaxed);
        let panel = window.to_panel::<MenuPanel>()?;
        configure_panel(&panel, PanelLevel::Status)?;
        let handle = app.clone();
        let guard = self.guard.clone();
        panel::on_resign_key(&panel, move || {
            guard.note_blur();
            on_dismiss(&handle);
        });
        Ok(())
    }

    fn show(&self, app: &AppHandle) {
        let Some(window) = window(app, PANEL_LABEL, "show") else {
            return;
        };
        flyout::place_panel(app, &window, PANEL_GAP);
        if with_panel(app, PANEL_LABEL, "show", |panel| panel.show_and_make_key()) {
            refresh_shadow_once(&window, &self.refresh_shadow);
        }
    }

    fn hide(&self, app: &AppHandle) {
        with_panel(app, PANEL_LABEL, "hide", |panel| panel.hide());
    }

    fn is_visible(&self, app: &AppHandle) -> bool {
        app.get_webview_panel(PANEL_LABEL)
            .map(|p| p.is_visible())
            .unwrap_or(false)
    }

    fn should_toggle_on_tray_click(&self) -> bool {
        self.guard.allows_toggle()
    }

    fn set_tray_text(&self, app: &AppHandle, text: &str) {
        let Some(tray) = app.tray_by_id(TRAY_ID) else {
            return log::warn!("flyout-macos: set_tray_text: no `{TRAY_ID}` tray");
        };
        if let Err(e) = tray.set_title(if text.is_empty() { None } else { Some(text) }) {
            log::warn!("flyout-macos: tray set_title failed: {e}");
        }
    }

    fn set_settings_mode(&self, app: &AppHandle, on: bool) {
        let policy = if on {
            tauri::ActivationPolicy::Regular
        } else {
            tauri::ActivationPolicy::Accessory
        };
        if let Err(e) = app.set_activation_policy(policy) {
            log::warn!("flyout-macos: set_activation_policy(settings_mode={on}) failed: {e}");
        }
    }

    fn tray_icon(&self) -> Option<(&'static [u8], bool)> {
        Some((TRAY_ICON, true))
    }

    fn setup_inspector(&self, app: &AppHandle) -> tauri::Result<()> {
        let Some(window) = window(app, INSPECTOR_LABEL, "setup_inspector") else {
            return Ok(());
        };
        self.refresh_inspector_shadow.store(glaze(&window), Ordering::Relaxed);
        let panel = window.to_panel::<InspectorPanel>()?;
        configure_panel(&panel, PanelLevel::Status)
    }

    fn show_inspector(&self, app: &AppHandle) {
        if !with_panel(app, INSPECTOR_LABEL, "show_inspector", |panel| panel.show()) {
            return;
        }
        if let Some(window) = app.get_webview_window(INSPECTOR_LABEL) {
            refresh_shadow_once(&window, &self.refresh_inspector_shadow);
        }
    }

    fn hide_inspector(&self, app: &AppHandle) {
        with_panel(app, INSPECTOR_LABEL, "hide_inspector", |panel| panel.hide());
    }

    fn setup_sheet(&self, app: &AppHandle, on_blur: Dismiss) -> tauri::Result<()> {
        let Some(window) = window(app, SHEET_LABEL, "setup_sheet") else {
            return Ok(());
        };
        self.refresh_sheet_shadow.store(glaze(&window), Ordering::Relaxed);
        let panel = window.to_panel::<SheetPanel>()?;
        configure_panel(&panel, PanelLevel::Status)?;
        let handle = app.clone();
        sheet_panel::on_resign_key(&panel, move || on_blur(&handle));
        Ok(())
    }

    fn show_sheet(&self, app: &AppHandle) {
        if !with_panel(app, SHEET_LABEL, "show_sheet", |panel| panel.show_and_make_key()) {
            return;
        }
        if let Some(window) = app.get_webview_window(SHEET_LABEL) {
            refresh_shadow_once(&window, &self.refresh_sheet_shadow);
        }
    }

    fn hide_sheet(&self, app: &AppHandle) {
        with_panel(app, SHEET_LABEL, "hide_sheet", |panel| panel.hide());
    }

    fn focus_panel(&self, app: &AppHandle) {
        with_panel(app, PANEL_LABEL, "focus_panel", |panel| panel.show_and_make_key());
    }

    fn setup_hud(&self, app: &AppHandle) -> tauri::Result<()> {
        let Some(window) = window(app, HUD_LABEL, "setup_hud") else {
            return Ok(());
        };
        if let Err(e) = window.set_ignore_cursor_events(true) {
            log::warn!("flyout-macos: hud set_ignore_cursor_events failed: {e}");
        }
        let panel = window.to_panel::<HudPanel>()?;
        configure_panel(&panel, PanelLevel::ScreenSaver)
    }

    fn show_hud(&self, app: &AppHandle) {
        with_panel(app, HUD_LABEL, "show_hud", |panel| panel.show());
    }

    fn hide_hud(&self, app: &AppHandle) {
        with_panel(app, HUD_LABEL, "hide_hud", |panel| panel.hide());
    }
}
