use serde::Serialize;

#[derive(Debug, Clone, Serialize, thiserror::Error)]
#[serde(rename_all = "camelCase")]
#[error("{message}")]
pub struct NexonError {
    pub kind: Kind,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<u16>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Kind {
    Api,
    Network,
    MissingApiKey,
    EmptyResponse,
    UnexpectedStatus,
    InvalidParameter,
}

impl NexonError {
    fn new(kind: Kind, message: impl Into<String>) -> Self {
        Self {
            kind,
            code: None,
            message: message.into(),
            status: None,
        }
    }
    pub fn missing_api_key() -> Self {
        Self::new(Kind::MissingApiKey, "missing api key")
    }
    pub fn empty_response() -> Self {
        Self::new(Kind::EmptyResponse, "empty response")
    }
    pub fn invalid_parameter(message: impl Into<String>) -> Self {
        Self::new(Kind::InvalidParameter, message)
    }
    pub fn network(message: impl Into<String>) -> Self {
        Self::new(Kind::Network, message)
    }
    pub fn unexpected_status(status: u16) -> Self {
        Self {
            status: Some(status),
            ..Self::new(Kind::UnexpectedStatus, format!("HTTP {status}"))
        }
    }

    pub fn from_response(status: u16, body: &[u8]) -> Self {
        #[derive(serde::Deserialize)]
        struct Body {
            error: Inner,
        }
        #[derive(serde::Deserialize)]
        struct Inner {
            name: String,
            message: String,
        }
        match serde_json::from_slice::<Body>(body) {
            Ok(b) => Self {
                kind: Kind::Api,
                code: Some(b.error.name),
                message: b.error.message,
                status: Some(status),
            },
            Err(_) => Self::unexpected_status(status),
        }
    }

    pub fn is_retryable_status(status: u16) -> bool {
        status == 429 || status >= 500
    }
}
