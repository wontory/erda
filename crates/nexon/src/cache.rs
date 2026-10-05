use std::{
    collections::BTreeMap,
    fs,
    path::{Path, PathBuf},
    time::{Duration, SystemTime},
};

use chrono::NaiveDate;
use sha2::{Digest, Sha256};

const MAX_BODY: usize = 16 * 1024 * 1024;
pub const MAX_AGE: Duration = Duration::from_secs(31 * 24 * 3600);
const TMP_MAX_AGE: Duration = Duration::from_secs(3600);

pub fn ttl_for(path: &str, query: &BTreeMap<String, String>, today: NaiveDate) -> Duration {
    let secs = if path.contains("/scheduler/") {
        60
    } else if path.contains("/history/") {
        let before_today = query
            .get("date")
            .and_then(|d| crate::kst::parse_date(d))
            .map(|d| d < today)
            .unwrap_or(false);
        if before_today {
            30 * 24 * 3600
        } else {
            120
        }
    } else if path.contains("/notice") {
        300
    } else if path.contains("/ranking/") {
        3600
    } else if path.ends_with("/id") || path.contains("/guild/id") {
        24 * 3600
    } else if path.contains("/character/list") || path.contains("/achievement") {
        600
    } else if path.contains("/battle-practice/") {
        3600
    } else {
        600
    };
    Duration::from_secs(secs)
}

pub fn key_hash(api_key: &str) -> String {
    hex::encode(Sha256::digest(api_key.as_bytes()))
}

pub fn cache_key(api_key: &str, path: &str, query: &BTreeMap<String, String>) -> String {
    let mut hasher = Sha256::new();
    hasher.update(Sha256::digest(api_key.as_bytes()));
    hasher.update(path.as_bytes());
    for (k, v) in query {
        hasher.update(b"&");
        hasher.update(k.as_bytes());
        hasher.update(b"=");
        hasher.update(v.as_bytes());
    }
    hex::encode(hasher.finalize())
}

pub struct DiskCache {
    dir: PathBuf,
}

pub struct Entry {
    pub body: Vec<u8>,
    pub saved_at: SystemTime,
}

impl DiskCache {
    pub fn new(dir: PathBuf) -> Self {
        let _ = fs::create_dir_all(&dir);
        Self { dir }
    }

    fn file(&self, key: &str) -> PathBuf {
        self.dir.join(key)
    }

    pub fn get(&self, key: &str) -> Option<Entry> {
        let path = self.file(key);
        let meta = fs::metadata(&path).ok()?;
        let body = fs::read(&path).ok()?;
        if body.is_empty() || serde_json::from_slice::<serde_json::Value>(&body).is_err() {
            return None;
        }
        Some(Entry {
            body,
            saved_at: meta.modified().ok()?,
        })
    }

    pub fn is_fresh(entry: &Entry, ttl: Duration, now: SystemTime) -> bool {
        now.duration_since(entry.saved_at).map(|age| age < ttl).unwrap_or(true)
    }

    pub fn put(&self, key: &str, body: &[u8]) {
        if body.len() > MAX_BODY {
            return;
        }
        if let Err(e) = crate::write_atomic(&self.file(key), body) {
            log::warn!("nexon cache: failed to write {key}: {e}");
        }
    }

    pub fn remove(&self, key: &str) {
        if let Err(e) = fs::remove_file(self.file(key)) {
            if e.kind() != std::io::ErrorKind::NotFound {
                log::warn!("nexon cache: failed to remove {key}: {e}");
            }
        }
    }

    pub fn total_size(&self) -> u64 {
        dir_size(&self.dir)
    }

    pub fn clear(&self) {
        let _ = fs::remove_dir_all(&self.dir);
        let _ = fs::create_dir_all(&self.dir);
    }

    pub fn evict(&self, max_age: Duration, now: SystemTime) -> (usize, usize) {
        let Ok(entries) = fs::read_dir(&self.dir) else {
            return (0, 0);
        };
        let (mut old, mut tmp) = (0, 0);
        for entry in entries.flatten() {
            let Ok(meta) = entry.metadata() else { continue };
            if !meta.is_file() {
                continue;
            }
            let age = meta
                .modified()
                .ok()
                .and_then(|m| now.duration_since(m).ok())
                .unwrap_or_default();
            let is_tmp = entry.file_name().to_string_lossy().ends_with(crate::fsutil::TMP_SUFFIX);
            if (is_tmp && age >= TMP_MAX_AGE) || (!is_tmp && age >= max_age) {
                match fs::remove_file(entry.path()) {
                    Ok(()) if is_tmp => tmp += 1,
                    Ok(()) => old += 1,
                    Err(e) => log::warn!("nexon cache: failed to evict {:?}: {e}", entry.file_name()),
                }
            }
        }
        (old, tmp)
    }
}

fn dir_size(dir: &Path) -> u64 {
    fs::read_dir(dir)
        .map(|rd| rd.flatten().filter_map(|e| e.metadata().ok()).map(|m| m.len()).sum())
        .unwrap_or(0)
}
