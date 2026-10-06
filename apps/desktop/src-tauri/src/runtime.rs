use std::{future::Future, time::Duration};

use serde::Serialize;
use tauri::{AppHandle, Emitter};

pub fn on_main_thread(app: &AppHandle, context: &str, f: impl FnOnce(&AppHandle) + Send + 'static) {
    let handle = app.clone();
    if let Err(e) = app.run_on_main_thread(move || f(&handle)) {
        log::warn!("{context}: run_on_main_thread failed: {e}");
    }
}

pub fn after<F, Fut>(app: &AppHandle, delay: Duration, f: F)
where
    F: FnOnce(AppHandle) -> Fut + Send + 'static,
    Fut: Future<Output = ()> + Send,
{
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(delay).await;
        f(app).await;
    });
}

pub fn emit<S: Serialize + Clone>(app: &AppHandle, event: &str, payload: S) {
    if let Err(e) = app.emit(event, payload) {
        log::warn!("emit {event} failed: {e}");
    }
}

pub fn emit_to<S: Serialize + Clone>(app: &AppHandle, target: &str, event: &str, payload: S) {
    if let Err(e) = app.emit_to(target, event, payload) {
        log::warn!("emit {event} failed: {e}");
    }
}
