use serde_json::Value;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const FILE: &str = "settings.json";

pub const API_KEY: &str = "settings.apiKey";
pub const TIMER_OVERLAY_SECONDS: &str = "settings.timerOverlaySeconds";
pub const TIMER_DUCKING: &str = "settings.timerDucking";
pub const TIMER_TICK_SOUND: &str = "settings.timerTickSound";
pub const TIMER_FINISH_SOUND: &str = "settings.timerSound";

const DEFAULT_OVERLAY_SECONDS: i64 = 5;

fn get(app: &AppHandle, key: &str) -> Option<Value> {
    app.store(FILE).ok().and_then(|store| store.get(key))
}

pub fn get_bool(app: &AppHandle, key: &str, default: bool) -> bool {
    get(app, key).and_then(|v| v.as_bool()).unwrap_or(default)
}

pub fn api_key(app: &AppHandle) -> String {
    get(app, API_KEY)
        .and_then(|v| v.as_str().map(|s| s.trim().to_string()))
        .unwrap_or_default()
}

pub fn timer_overlay_seconds(app: &AppHandle) -> i64 {
    get(app, TIMER_OVERLAY_SECONDS)
        .and_then(|v| v.as_i64())
        .unwrap_or(DEFAULT_OVERLAY_SECONDS)
}
