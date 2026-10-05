use std::{fs, path::PathBuf};

use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

#[derive(Debug, Default, Clone, Serialize, Deserialize, PartialEq)]
struct Record {
    date: Option<NaiveDate>,
    count: u32,
}

pub struct CallBudget {
    file: PathBuf,
    state: Mutex<Record>,
}

impl CallBudget {
    pub fn new(file: PathBuf) -> Self {
        let state = fs::read(&file)
            .ok()
            .and_then(|b| serde_json::from_slice(&b).ok())
            .unwrap_or_default();
        Self {
            file,
            state: Mutex::new(state),
        }
    }

    pub async fn record(&self, today: NaiveDate) -> u32 {
        let mut record = self.state.lock().await;
        if record.date != Some(today) {
            *record = Record {
                date: Some(today),
                count: 0,
            };
        }
        record.count += 1;
        self.persist(&record).await;
        record.count
    }

    async fn persist(&self, record: &Record) {
        let bytes = match serde_json::to_vec(record) {
            Ok(bytes) => bytes,
            Err(e) => return log::warn!("nexon budget: calls.json serialize failed: {e}"),
        };
        let file = self.file.clone();
        match tokio::task::spawn_blocking(move || crate::write_atomic(&file, &bytes)).await {
            Ok(Ok(())) => {}
            Ok(Err(e)) => log::warn!("nexon budget: calls.json write failed: {e}"),
            Err(e) => log::warn!("nexon budget: calls.json write task failed: {e}"),
        }
    }

    pub async fn count_today(&self, today: NaiveDate) -> u32 {
        let s = self.state.lock().await;
        if s.date == Some(today) {
            s.count
        } else {
            0
        }
    }
}
