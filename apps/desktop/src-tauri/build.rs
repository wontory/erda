const COMMANDS: &[&str] = &[
    "open_settings",
    "hide_panel_cmd",
    "inspector_show",
    "inspector_hide",
    "sheet_show",
    "sheet_hide",
    "window_fit",
    "nexon_request",
    "nexon_character_look",
    "nexon_calls_today",
    "nexon_cache_size",
    "nexon_cache_clear",
    "timers_start",
    "timers_start_group",
    "timers_cancel",
    "timers_cancel_all",
    "timers_set_repeat",
    "timers_restart",
    "timers_dismiss_completed",
    "timers_dismiss_all_completed",
    "timers_snapshot",
    "notices_snapshot",
    "notices_refresh",
    "notices_mark_seen",
    "notices_mark_all_seen",
    "history_load",
    "history_save",
    "sleep_ms",
    "sound_preview",
];

fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new().app_manifest(tauri_build::AppManifest::new().commands(COMMANDS)),
    )
    .expect("failed to run tauri-build");
}
