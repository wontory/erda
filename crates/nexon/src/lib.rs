mod budget;
pub mod cache;
mod error;
mod fsutil;
mod kst;
mod throttle;

use std::{
    collections::BTreeMap,
    path::PathBuf,
    sync::Arc,
    time::{Duration, SystemTime},
};

use serde::Deserialize;

pub use error::{Kind, NexonError};
pub use fsutil::write_atomic;
use {budget::CallBudget, cache::DiskCache, throttle::Throttle};

const BASE_URL: &str = "https://open.api.nexon.com";
const REQUEST_TIMEOUT: Duration = Duration::from_secs(20);
const MIN_GAP: Duration = Duration::from_millis(220);
const RETRY_DELAYS_MS: [u64; 2] = [900, 1800];
const NETWORK_MESSAGE: &str = "네트워크에 연결할 수 없어요.";
const NOT_FOUND_TTL: Duration = Duration::from_secs(3600);
const NOT_FOUND_CODE: &str = "OPENAPI00004";
const HTTP_OK: u16 = 200;
const HTTP_TOO_MANY_REQUESTS: u16 = 429;
const LOOK_PATH: &str = "/static/maplestory/character/look/";

fn network_error(e: reqwest::Error) -> NexonError {
    log::warn!("nexon: request failed: {}", e.without_url());
    NexonError::network(NETWORK_MESSAGE)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CachePolicy {
    UseCache,
    Refresh,
    Ignore,
}

impl CachePolicy {
    fn uses_cache(self) -> bool {
        self != CachePolicy::Ignore
    }

    fn serves_fresh_cache(self) -> bool {
        self == CachePolicy::UseCache
    }
}

fn not_found_key(path: &str, key: &str) -> Option<String> {
    path.contains("/guild/id").then(|| format!("nf-{key}"))
}

fn body_text(body: &[u8]) -> String {
    String::from_utf8_lossy(body).into_owned()
}

fn validate(api_key: &str, path: &str) -> Result<(), NexonError> {
    if api_key.is_empty() {
        return Err(NexonError::missing_api_key());
    }
    if !path.starts_with('/') || path.contains(['?', '#']) {
        return Err(NexonError::invalid_parameter(path));
    }
    Ok(())
}

fn ok_body(body: &[u8]) -> Result<String, NexonError> {
    if body.is_empty() {
        return Err(NexonError::empty_response());
    }
    if serde_json::from_slice::<serde_json::Value>(body).is_err() {
        return Err(NexonError {
            message: "non-JSON body".into(),
            ..NexonError::unexpected_status(HTTP_OK)
        });
    }
    Ok(body_text(body))
}

fn can_fall_back_to_cache(err: &NexonError) -> bool {
    err.kind == Kind::Network || err.status.is_some_and(NexonError::is_retryable_status)
}

pub struct Gateway {
    base_url: String,
    client: reqwest::Client,
    cache: Arc<DiskCache>,
    throttle: Throttle,
    budget: CallBudget,
}

impl Gateway {
    pub fn new(cache_dir: PathBuf, data_dir: PathBuf) -> Result<Self, reqwest::Error> {
        if let Err(e) = std::fs::create_dir_all(&data_dir) {
            log::warn!("nexon: data dir create failed: {e}");
        }
        let client = reqwest::Client::builder().timeout(REQUEST_TIMEOUT).build()?;
        let cache = Arc::new(DiskCache::new(cache_dir));
        spawn_eviction(cache.clone());
        Ok(Self {
            base_url: BASE_URL.to_string(),
            client,
            cache,
            throttle: Throttle::new(MIN_GAP),
            budget: CallBudget::new(data_dir.join("calls.json")),
        })
    }

    async fn blocking_cache<T: Send + 'static>(&self, f: impl FnOnce(&DiskCache) -> T + Send + 'static) -> Option<T> {
        let cache = self.cache.clone();
        match tokio::task::spawn_blocking(move || f(&cache)).await {
            Ok(v) => Some(v),
            Err(e) => {
                log::warn!("nexon cache: blocking task failed: {e}");
                None
            }
        }
    }

    async fn cache_get(&self, key: &str) -> Option<cache::Entry> {
        let key = key.to_string();
        self.blocking_cache(move |c| c.get(&key)).await.flatten()
    }

    async fn cache_put(&self, key: &str, body: &str) {
        let (key, body) = (key.to_string(), body.as_bytes().to_vec());
        self.blocking_cache(move |c| c.put(&key, &body)).await;
    }

    async fn cache_remove(&self, key: &str) {
        let key = key.to_string();
        self.blocking_cache(move |c| c.remove(&key)).await;
    }

    pub async fn character_look(&self, url: &str) -> Result<Vec<u8>, NexonError> {
        let target = reqwest::Url::parse(url).map_err(|_| NexonError::invalid_parameter(url))?;
        let base = reqwest::Url::parse(&self.base_url).map_err(|_| NexonError::invalid_parameter(url))?;
        if target.origin() != base.origin() || !target.path().starts_with(LOOK_PATH) {
            return Err(NexonError::invalid_parameter(url));
        }
        let res = self.client.get(target).send().await.map_err(network_error)?;
        let status = res.status().as_u16();
        if status != HTTP_OK || !res.url().path().starts_with(LOOK_PATH) {
            return Err(NexonError::unexpected_status(status));
        }
        Ok(res.bytes().await.map_err(network_error)?.to_vec())
    }

    pub async fn request(
        &self,
        api_key: &str,
        path: &str,
        query: BTreeMap<String, String>,
        policy: CachePolicy,
    ) -> Result<String, NexonError> {
        self.request_meta(api_key, path, query, policy)
            .await
            .map(|(body, _)| body)
    }

    pub async fn request_meta(
        &self,
        api_key: &str,
        path: &str,
        query: BTreeMap<String, String>,
        policy: CachePolicy,
    ) -> Result<(String, bool), NexonError> {
        let api_key = api_key.trim();
        validate(api_key, path)?;
        let key = cache::cache_key(api_key, path, &query);
        let today = kst::today();
        let not_found_key = not_found_key(path, &key);
        if policy.serves_fresh_cache() {
            if let Some(err) = self.remembered_not_found(not_found_key.as_deref()).await {
                log::debug!("nexon {path}: serving remembered not-found");
                return Err(err);
            }
        }
        let cached = if policy.uses_cache() {
            self.cache_get(&key).await
        } else {
            None
        };
        if policy.serves_fresh_cache() {
            if let Some(entry) = cached
                .as_ref()
                .filter(|e| DiskCache::is_fresh(e, cache::ttl_for(path, &query, today), SystemTime::now()))
            {
                return Ok((body_text(&entry.body), false));
            }
        }

        match self.fetch(api_key, path, &query, today).await {
            Ok(body) => {
                if let Some(nf_key) = &not_found_key {
                    self.cache_remove(nf_key).await;
                }
                if policy.uses_cache() {
                    self.cache_put(&key, &body).await;
                }
                Ok((body, false))
            }
            Err(err) => {
                if policy.uses_cache() {
                    self.remember_not_found(not_found_key.as_deref(), &err).await;
                }
                match cached {
                    Some(entry) if can_fall_back_to_cache(&err) => {
                        log::warn!("nexon {path}: {err}; serving stale cache");
                        Ok((body_text(&entry.body), true))
                    }
                    _ => Err(err),
                }
            }
        }
    }

    async fn remembered_not_found(&self, nf_key: Option<&str>) -> Option<NexonError> {
        let entry = self.cache_get(nf_key?).await?;
        DiskCache::is_fresh(&entry, NOT_FOUND_TTL, SystemTime::now())
            .then(|| NexonError::from_response(400, &entry.body))
    }

    async fn remember_not_found(&self, nf_key: Option<&str>, err: &NexonError) {
        let Some(nf_key) = nf_key else { return };
        if err.code.as_deref() != Some(NOT_FOUND_CODE) {
            return;
        }
        let body = serde_json::json!({"error": {"name": NOT_FOUND_CODE, "message": err.message}}).to_string();
        self.cache_put(nf_key, &body).await;
    }

    async fn fetch(
        &self,
        api_key: &str,
        path: &str,
        query: &BTreeMap<String, String>,
        today: chrono::NaiveDate,
    ) -> Result<String, NexonError> {
        let mut retry_delays = RETRY_DELAYS_MS.iter();
        loop {
            let (status, body) = self.send(api_key, path, query, today).await?;
            if status == HTTP_OK {
                return ok_body(&body);
            }
            if status == HTTP_TOO_MANY_REQUESTS {
                if let Some(&delay_ms) = retry_delays.next() {
                    tokio::time::sleep(Duration::from_millis(delay_ms)).await;
                    continue;
                }
            }
            return Err(NexonError::from_response(status, &body));
        }
    }

    async fn send(
        &self,
        api_key: &str,
        path: &str,
        query: &BTreeMap<String, String>,
        today: chrono::NaiveDate,
    ) -> Result<(u16, Vec<u8>), NexonError> {
        self.throttle.wait().await;
        self.budget.record(today).await;
        let response = self
            .client
            .get(format!("{}{path}", self.base_url))
            .query(&query.iter().collect::<Vec<_>>())
            .header("x-nxopen-api-key", api_key)
            .header("accept", "application/json")
            .send()
            .await
            .map_err(network_error)?;
        let status = response.status().as_u16();
        let body = response.bytes().await.map_err(network_error)?;
        Ok((status, body.to_vec()))
    }

    pub async fn calls_today(&self) -> u32 {
        self.budget.count_today(kst::today()).await
    }

    pub async fn cache_size(&self) -> u64 {
        self.blocking_cache(|c| c.total_size()).await.unwrap_or(0)
    }

    pub async fn cache_clear(&self) {
        self.blocking_cache(|c| c.clear()).await;
    }
}

fn spawn_eviction(cache: Arc<DiskCache>) {
    let run = move || {
        let (old, tmp) = cache.evict(cache::MAX_AGE, SystemTime::now());
        log::info!("nexon cache: evicted {old} stale entries and {tmp} temp files");
    };
    match tokio::runtime::Handle::try_current() {
        Ok(handle) => drop(handle.spawn_blocking(run)),
        Err(_) => {
            if let Err(e) = std::thread::Builder::new().name("nexon-cache-evict".into()).spawn(run) {
                log::warn!("nexon cache: eviction thread failed to start: {e}");
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn character_look_only_fetches_nexon_look_images() {
        let dir = std::env::temp_dir().join(format!("nexon-look-test-{}", std::process::id()));
        let gateway = Gateway::new(dir.join("cache"), dir.join("data")).unwrap();
        for url in [
            "https://example.com/static/maplestory/character/look/ABC",
            "http://open.api.nexon.com/static/maplestory/character/look/ABC",
            "https://open.api.nexon.com/maplestory/v1/id?character_name=x",
            "not a url",
        ] {
            let err = gateway.character_look(url).await.unwrap_err();
            assert_eq!(err.kind, Kind::InvalidParameter, "{url}");
        }
        let _ = std::fs::remove_dir_all(dir);
    }
}
