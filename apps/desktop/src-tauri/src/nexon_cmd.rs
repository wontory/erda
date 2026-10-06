use std::collections::{BTreeMap, HashMap};

use nexon::{CachePolicy, Gateway, NexonError};
use tauri::{AppHandle, Manager, State};

use crate::settings_store;

pub struct GatewayState(pub Gateway);

pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    let cache_dir = app.path().app_cache_dir()?.join("nexon");
    let data_dir = app.path().app_data_dir()?;
    let gateway = Gateway::new(cache_dir, data_dir).map_err(|e| tauri::Error::Anyhow(e.into()))?;
    app.manage(GatewayState(gateway));
    Ok(())
}

#[tauri::command]
pub async fn nexon_request(
    app: AppHandle,
    gateway: State<'_, GatewayState>,
    path: String,
    query: HashMap<String, String>,
    policy: CachePolicy,
) -> Result<String, NexonError> {
    let api_key = settings_store::api_key(&app);
    let query: BTreeMap<String, String> = query.into_iter().collect();
    gateway.0.request(&api_key, &path, query, policy).await
}

#[tauri::command]
pub async fn nexon_calls_today(gateway: State<'_, GatewayState>) -> Result<u32, String> {
    Ok(gateway.0.calls_today().await)
}

#[tauri::command]
pub async fn nexon_cache_size(gateway: State<'_, GatewayState>) -> Result<u64, String> {
    Ok(gateway.0.cache_size().await)
}

#[tauri::command]
pub async fn nexon_cache_clear(gateway: State<'_, GatewayState>) -> Result<(), String> {
    gateway.0.cache_clear().await;
    Ok(())
}
