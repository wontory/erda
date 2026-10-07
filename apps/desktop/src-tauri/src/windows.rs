use std::{sync::Arc, time::Duration};

use flyout::Flyout;
use tauri::{window::Color, AppHandle, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent};

use crate::runtime;

const HIDE_FADE: Duration = Duration::from_millis(120);
const DEV_PANEL_DELAY: Duration = Duration::from_secs(3);
const DEV_INSPECTOR_DELAY: Duration = Duration::from_secs(5);
const INSPECTOR_GAP: f64 = 8.0;
const INSPECTOR_MARGIN: f64 = 8.0;
const SETTINGS_LABEL: &str = "settings";

pub struct FlyoutState(pub Box<dyn Flyout>);

pub fn setup(app: &AppHandle, flyout: Box<dyn Flyout>) -> tauri::Result<()> {
    let dismiss: flyout::Dismiss = Arc::new(|app: &AppHandle| hide_panel(app));
    let toggle: flyout::Toggle = Arc::new(|app: &AppHandle| toggle_panel(app));
    flyout.setup(app, dismiss, toggle)?;
    flyout.setup_inspector(app)?;
    flyout.setup_hud(app)?;
    app.manage(FlyoutState(flyout));
    Ok(())
}

pub fn flyout(app: &AppHandle) -> &dyn Flyout {
    app.state::<FlyoutState>().inner().0.as_ref()
}

pub fn toggle_panel(app: &AppHandle) {
    let f = flyout(app);
    if f.is_visible(app) {
        hide_panel(app);
    } else if f.should_toggle_on_tray_click() {
        show_panel(app);
    }
}

pub fn show_panel(app: &AppHandle) {
    flyout(app).show(app);
    runtime::emit_to(app, flyout::PANEL_LABEL, "panel:shown", ());
}

pub fn show_panel_after_launch(app: &AppHandle) {
    runtime::after(app, DEV_PANEL_DELAY, |app| async move {
        runtime::on_main_thread(&app, "dev show panel", show_panel);
    });
}

pub fn show_inspector_after_launch(app: &AppHandle) {
    runtime::after(app, DEV_INSPECTOR_DELAY, |app| async move {
        let payload = serde_json::json!({
            "kind": "title",
            "title": { "title_name": "견본 칭호", "title_description": "인스펙터 창 모양 확인용 견본이에요." }
        });
        runtime::on_main_thread(&app, "dev show inspector", move |h| inspector_show(h.clone(), payload));
    });
}

pub fn hide_panel(app: &AppHandle) {
    let f = flyout(app);
    f.hide_inspector(app);
    if !f.is_visible(app) {
        return;
    }
    runtime::emit_to(app, flyout::PANEL_LABEL, "panel:hiding", ());
    runtime::after(app, HIDE_FADE, |app| async move {
        runtime::on_main_thread(&app, "hide panel", |h| {
            let f = flyout(h);
            f.hide_inspector(h);
            f.hide(h);
        });
    });
}

fn place_inspector(app: &AppHandle) {
    let (Some(main), Some(inspector)) = (
        app.get_webview_window(flyout::PANEL_LABEL),
        app.get_webview_window(flyout::INSPECTOR_LABEL),
    ) else {
        return log::warn!("place_inspector: main or inspector window missing");
    };
    let (pos, size, inspector_size, scale) = match (
        main.outer_position(),
        main.outer_size(),
        inspector.outer_size(),
        main.scale_factor(),
    ) {
        (Ok(p), Ok(s), Ok(i), Ok(f)) => (p, s, i, f),
        _ => return log::warn!("place_inspector: could not read window geometry"),
    };
    let monitor = match main.current_monitor() {
        Ok(Some(m)) => m,
        Ok(None) => return log::warn!("place_inspector: main window has no monitor"),
        Err(e) => return log::warn!("place_inspector: current_monitor failed: {e}"),
    };
    let p = flyout::anchor_beside(
        flyout::Rect::from_physical(pos, size),
        flyout::Size::from(inspector_size),
        flyout::monitor_rect_of(&monitor),
        flyout::to_physical(INSPECTOR_GAP, scale),
        flyout::to_physical(INSPECTOR_MARGIN, scale),
    );
    if let Err(e) = inspector.set_position(tauri::PhysicalPosition::new(p.x, p.y)) {
        log::warn!("inspector set_position failed: {e}");
    }
}

#[tauri::command]
pub fn inspector_show(app: AppHandle, payload: serde_json::Value) {
    if !flyout(&app).is_visible(&app) {
        return;
    }
    place_inspector(&app);
    runtime::emit_to(&app, flyout::INSPECTOR_LABEL, "inspector:content", payload);
    flyout(&app).show_inspector(&app);
}

#[tauri::command]
pub fn inspector_hide(app: AppHandle) {
    flyout(&app).hide_inspector(&app);
}

fn settings_url(page: Option<&str>) -> String {
    match page.filter(|p| !p.is_empty() && p.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')) {
        Some(p) => format!("settings.html?page={p}"),
        None => "settings.html".into(),
    }
}

fn settings_background(app: &AppHandle) -> Color {
    let theme = app.get_webview_window(flyout::PANEL_LABEL).and_then(|w| w.theme().ok());
    match theme {
        Some(tauri::Theme::Dark) => Color(37, 37, 37, 255),
        _ => Color(255, 255, 255, 255),
    }
}

fn build_settings_window(app: &AppHandle, page: Option<&str>) -> tauri::Result<WebviewWindow> {
    let window = WebviewWindowBuilder::new(app, SETTINGS_LABEL, WebviewUrl::App(settings_url(page).into()))
        .title("Erda 설정")
        .inner_size(760.0, 500.0)
        .min_inner_size(640.0, 420.0)
        .center()
        .visible(false)
        .background_color(settings_background(app))
        .build()?;
    let handle = app.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            hide_settings(&handle);
        }
    });
    Ok(window)
}

fn hide_settings(app: &AppHandle) {
    if let Some(w) = app.get_webview_window(SETTINGS_LABEL) {
        if let Err(e) = w.hide() {
            log::warn!("settings hide failed: {e}");
        }
    }
    flyout(app).set_settings_mode(app, false);
}

pub fn show_settings(app: &AppHandle, page: Option<&str>) {
    hide_panel(app);
    flyout(app).set_settings_mode(app, true);
    let window = match app.get_webview_window(SETTINGS_LABEL) {
        Some(w) => w,
        None => match build_settings_window(app, page) {
            Ok(w) => w,
            Err(e) => {
                log::error!("settings window build failed: {e}");
                flyout(app).set_settings_mode(app, false);
                return;
            }
        },
    };
    if let Err(e) = window.show() {
        log::warn!("settings show failed: {e}");
    }
    if let Err(e) = window.set_focus() {
        log::warn!("settings set_focus failed: {e}");
    }
    if let Some(page) = page {
        runtime::emit_to(app, SETTINGS_LABEL, "settings:page", page);
    }
}

#[tauri::command]
pub async fn open_settings(app: AppHandle, page: Option<String>) {
    runtime::on_main_thread(&app, "open_settings", move |h| show_settings(h, page.as_deref()));
}

#[tauri::command]
pub fn hide_panel_cmd(app: AppHandle) {
    hide_panel(&app);
}

pub fn show_hud(app: &AppHandle) {
    flyout(app).show_hud(app);
}

pub fn hide_hud(app: &AppHandle) {
    flyout(app).hide_hud(app);
}
