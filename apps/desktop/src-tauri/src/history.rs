use std::{
    path::{Path, PathBuf},
    time::Duration,
};

use tauri::{AppHandle, Manager};

use crate::settings_store;

const KINDS: [&str; 4] = ["starforce", "potential", "cube", "soul"];
const MAX_SLEEP_MS: u64 = 24 * 3600 * 1000;

fn history_file(dir: &Path, kind: &str) -> Result<PathBuf, String> {
    if !KINDS.contains(&kind) {
        return Err(format!("알 수 없는 기록 종류: {kind}"));
    }
    Ok(dir.join(format!("{kind}.json")))
}

fn write_atomic(path: &Path, json: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("기록 폴더를 만들지 못했어요: {e}"))?;
    }
    nexon::write_atomic(path, json.as_bytes()).map_err(|e| format!("기록을 저장하지 못했어요: {e}"))
}

fn read_optional(path: &Path) -> Result<Option<String>, String> {
    match std::fs::read_to_string(path) {
        Ok(s) => Ok(Some(s)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(format!("기록을 읽지 못했어요: {e}")),
    }
}

fn key_folder(api_key: &str) -> Option<String> {
    let key = api_key.trim();
    if key.is_empty() {
        return None;
    }
    Some(nexon::cache::key_hash(key)[..12].to_string())
}

fn check_folder(expected: Option<&str>, current: Option<&str>) -> Result<(), String> {
    match (expected, current) {
        (_, None) => Err("API 키가 없어 기록을 저장하지 않았어요".into()),
        (Some(e), Some(c)) if e == c => Ok(()),
        _ => Err("API 키가 바뀌어 이전 기록을 저장하지 않았어요".into()),
    }
}

fn history_base(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|d| d.join("history"))
        .map_err(|e| e.to_string())
}

async fn blocking<T: Send + 'static>(f: impl FnOnce() -> Result<T, String> + Send + 'static) -> Result<T, String> {
    tokio::task::spawn_blocking(f)
        .await
        .map_err(|e| format!("기록 작업이 중단되었어요: {e}"))?
}

#[derive(serde::Serialize)]
pub struct LoadedHistory {
    folder: Option<String>,
    json: Option<String>,
}

#[tauri::command]
pub async fn history_load(app: AppHandle, kind: String) -> Result<LoadedHistory, String> {
    let Some(folder) = key_folder(&settings_store::api_key(&app)) else {
        return Ok(LoadedHistory {
            folder: None,
            json: None,
        });
    };
    let path = history_file(&history_base(&app)?.join(&folder), &kind)?;
    let json = blocking(move || read_optional(&path))
        .await
        .inspect_err(|e| log::warn!("history_load {kind}: {e}"))?;
    Ok(LoadedHistory {
        folder: Some(folder),
        json,
    })
}

#[tauri::command]
pub async fn history_save(app: AppHandle, kind: String, json: String, folder: Option<String>) -> Result<(), String> {
    let current = key_folder(&settings_store::api_key(&app));
    check_folder(folder.as_deref(), current.as_deref()).inspect_err(|e| log::warn!("history_save {kind}: {e}"))?;
    let path = history_file(&history_base(&app)?.join(current.unwrap_or_default()), &kind)?;
    blocking(move || write_atomic(&path, &json))
        .await
        .inspect_err(|e| log::warn!("history_save {kind}: {e}"))
}

#[tauri::command]
pub async fn sleep_ms(ms: u64) {
    tokio::time::sleep(Duration::from_millis(ms.min(MAX_SLEEP_MS))).await;
}
