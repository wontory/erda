use std::time::{Duration, Instant};
use tokio::sync::Mutex;

pub struct Throttle {
    min_gap: Duration,
    last: Mutex<Option<Instant>>,
}

impl Throttle {
    pub fn new(min_gap: Duration) -> Self {
        Self {
            min_gap,
            last: Mutex::new(None),
        }
    }

    pub async fn wait(&self) {
        let mut last = self.last.lock().await;
        if let Some(prev) = *last {
            let elapsed = prev.elapsed();
            if elapsed < self.min_gap {
                tokio::time::sleep(self.min_gap - elapsed).await;
            }
        }
        *last = Some(Instant::now());
    }
}
