use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle,
};

use crate::windows;

const MENU_SETTINGS: &str = "settings";
const MENU_QUIT: &str = "quit";

pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    let settings = MenuItem::with_id(app, MENU_SETTINGS, "설정…", true, Some("CmdOrCtrl+,"))?;
    let quit = MenuItem::with_id(app, MENU_QUIT, "Erda 종료", true, Some("CmdOrCtrl+Q"))?;
    let menu = Menu::with_items(app, &[&settings, &PredefinedMenuItem::separator(app)?, &quit])?;

    let (bytes, template) = windows::flyout(app).tray_icon();
    let icon = tauri::image::Image::from_bytes(bytes)?;
    TrayIconBuilder::with_id(flyout::TRAY_ID)
        .icon(icon)
        .icon_as_template(template)
        .tooltip("Erda")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            MENU_SETTINGS => windows::show_settings(app, None),
            MENU_QUIT => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            match &event {
                TrayIconEvent::Click { rect, .. }
                | TrayIconEvent::Enter { rect, .. }
                | TrayIconEvent::Move { rect, .. }
                | TrayIconEvent::Leave { rect, .. } => flyout::remember_tray_rect(tray.app_handle(), rect),
                _ => {}
            }
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                windows::toggle_panel(tray.app_handle());
            }
        })
        .build(app)?;
    Ok(())
}

pub fn set_text(app: &AppHandle, text: &str) {
    windows::flyout(app).set_tray_text(app, text);
}
