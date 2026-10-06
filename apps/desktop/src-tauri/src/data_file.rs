use std::{
    io,
    path::{Path, PathBuf},
};

use tauri::{AppHandle, Manager};

pub enum Contents {
    Missing,
    Text(String),
    Unreadable,
}

pub fn in_app_data(app: &AppHandle, name: &str) -> tauri::Result<PathBuf> {
    let dir = app.path().app_data_dir()?;
    if let Err(e) = std::fs::create_dir_all(&dir) {
        log::warn!("app data dir create failed: {e}");
    }
    Ok(dir.join(name))
}

fn name(file: &Path) -> std::borrow::Cow<'_, str> {
    file.file_name().unwrap_or(file.as_os_str()).to_string_lossy()
}

pub fn read(file: &Path) -> Contents {
    match std::fs::read_to_string(file) {
        Ok(text) => Contents::Text(text),
        Err(e) if e.kind() == io::ErrorKind::NotFound => Contents::Missing,
        Err(e) => {
            log::warn!("{} read failed: {e}", name(file));
            Contents::Unreadable
        }
    }
}

pub fn back_up_corrupt(file: &Path) {
    if let Err(e) = std::fs::rename(file, file.with_extension("json.corrupt")) {
        log::warn!("{} corrupt backup failed: {e}", name(file));
    }
}

pub fn write(file: &Path, json: &str) {
    if let Err(e) = nexon::write_atomic(file, json.as_bytes()) {
        log::warn!("{} write failed: {e}", name(file));
    }
}

pub async fn write_in_background(file: PathBuf, json: String) {
    let label = name(&file).into_owned();
    if let Err(e) = tauri::async_runtime::spawn_blocking(move || write(&file, &json)).await {
        log::warn!("{label} write task failed: {e}");
    }
}
