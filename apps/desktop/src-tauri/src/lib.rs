mod data_file;
mod duck;
mod history;
mod hud;
mod nexon_cmd;
mod notices;
mod platform;
mod runtime;
mod settings_store;
mod sound;
mod timers;
mod tray;
mod windows;

use log::LevelFilter;
use tauri::Manager;
use tauri_plugin_log::RotationStrategy;

fn log_plugin<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri_plugin_log::Builder::new()
        .level(LevelFilter::Info)
        .level_for("rustls", LevelFilter::Warn)
        .level_for("reqwest", LevelFilter::Warn)
        .level_for("hyper_util", LevelFilter::Warn)
        .level_for("tao", LevelFilter::Warn)
        .level_for("wry", LevelFilter::Warn)
        .max_file_size(2_000_000)
        .rotation_strategy(RotationStrategy::KeepOne)
        .build()
}

const AUTOSTART_ARG: &str = "--autostart";

fn opened_by_user() -> bool {
    !std::env::args().any(|a| a == AUTOSTART_ARG)
}

fn dev_flag(name: &str) -> bool {
    cfg!(debug_assertions) && std::env::var(name).as_deref() == Ok("1")
}

fn focus_running_instance(app: &tauri::AppHandle) {
    runtime::on_main_thread(app, "single instance", |handle| {
        if handle.try_state::<windows::FlyoutState>().is_some() {
            windows::show_panel(handle);
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            focus_running_instance(app)
        }))
        .plugin(log_plugin())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![AUTOSTART_ARG]),
        ));
    platform::register(builder)
        .invoke_handler(tauri::generate_handler![
            windows::open_settings,
            windows::hide_panel_cmd,
            windows::inspector_show,
            windows::inspector_hide,
            nexon_cmd::nexon_request,
            nexon_cmd::nexon_calls_today,
            nexon_cmd::nexon_cache_size,
            nexon_cmd::nexon_cache_clear,
            timers::timers_start,
            timers::timers_start_group,
            timers::timers_cancel,
            timers::timers_cancel_all,
            timers::timers_set_repeat,
            timers::timers_restart,
            timers::timers_dismiss_completed,
            timers::timers_dismiss_all_completed,
            timers::timers_snapshot,
            notices::notices_snapshot,
            notices::notices_refresh,
            notices::notices_mark_seen,
            notices::notices_mark_all_seen,
            history::history_load,
            history::history_save,
            history::sleep_ms,
            sound::sound_preview
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            nexon_cmd::setup(&handle)?;
            let flyout = platform::make_flyout();
            flyout.set_settings_mode(&handle, false);
            handle.manage(flyout::TrayRect::default());
            windows::setup(&handle, flyout)?;
            tray::setup(&handle)?;
            hud::setup(&handle);
            timers::setup(&handle)?;
            notices::setup(&handle)?;
            if dev_flag("ERDA_DEV_SHOW_PANEL") {
                windows::show_panel_after_launch(&handle);
            } else if cfg!(all(windows, not(debug_assertions))) && opened_by_user() {
                windows::show_panel(&handle);
            }
            if dev_flag("ERDA_DEV_INSPECTOR") {
                windows::show_inspector_after_launch(&handle);
            }
            if dev_flag("ERDA_DEV_HUD") {
                hud::show_sample_after_launch(&handle);
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|_, event| {
            if let tauri::RunEvent::Exit = event {
                duck::shutdown();
            }
        });
}
