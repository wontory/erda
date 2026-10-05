use chrono::{DateTime, FixedOffset, NaiveDate, Utc};

pub fn offset() -> FixedOffset {
    FixedOffset::east_opt(9 * 3600).unwrap()
}

pub fn now() -> DateTime<FixedOffset> {
    Utc::now().with_timezone(&offset())
}

pub fn today() -> NaiveDate {
    now().date_naive()
}

pub fn parse_date(s: &str) -> Option<NaiveDate> {
    NaiveDate::parse_from_str(s, "%Y-%m-%d").ok()
}
