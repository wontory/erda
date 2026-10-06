use std::time::Duration;

use serde::Deserialize;
use tauri::AppHandle;

use crate::{duck, settings_store};

const PREVIEW_TICKS: usize = 5;
const PREVIEW_DUCK_SETTLE: Duration = Duration::from_millis(600);
const PREVIEW_TICK_GAP: Duration = Duration::from_secs(1);

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Sound {
    Tick,
    Finish,
}

impl Sound {
    fn bytes(self) -> &'static [u8] {
        match self {
            Sound::Tick => include_bytes!("../sounds/tick.wav"),
            Sound::Finish => include_bytes!("../sounds/finish.wav"),
        }
    }

    fn setting(self) -> &'static str {
        match self {
            Sound::Tick => settings_store::TIMER_TICK_SOUND,
            Sound::Finish => settings_store::TIMER_FINISH_SOUND,
        }
    }

    fn enabled(self, app: &AppHandle) -> bool {
        settings_store::get_bool(app, self.setting(), true)
    }
}

fn ducking_setting(app: &AppHandle) -> bool {
    settings_store::get_bool(app, settings_store::TIMER_DUCKING, true)
}

pub fn ducking_enabled(app: &AppHandle) -> bool {
    ducking_setting(app) && (Sound::Tick.enabled(app) || Sound::Finish.enabled(app))
}

pub fn play_if_enabled(app: &AppHandle, sound: Sound) {
    if sound.enabled(app) {
        play(app, sound);
    }
}

#[tauri::command]
pub async fn sound_preview(app: AppHandle, sound: Sound) {
    match sound {
        Sound::Finish => play(&app, Sound::Finish),
        Sound::Tick => preview_countdown(&app).await,
    }
}

async fn preview_countdown(app: &AppHandle) {
    let ducks = ducking_setting(app);
    if ducks {
        duck::prepare(duck::PREPARE_LEAD + duck::HOLD);
        tokio::time::sleep(PREVIEW_DUCK_SETTLE).await;
    }
    for _ in 0..PREVIEW_TICKS {
        if ducks {
            duck::hold(duck::HOLD);
        }
        play(app, Sound::Tick);
        tokio::time::sleep(PREVIEW_TICK_GAP).await;
    }
    if ducks {
        duck::release();
    }
}

#[cfg(target_os = "macos")]
fn play(app: &AppHandle, sound: Sound) {
    crate::runtime::on_main_thread(app, "sound", move |_| mac::play(sound));
}

#[cfg(target_os = "macos")]
mod mac {
    use std::cell::RefCell;
    use std::collections::hash_map::Entry;
    use std::collections::HashMap;

    use objc2::rc::Retained;
    use objc2::AnyThread;
    use objc2_app_kit::NSSound;
    use objc2_foundation::NSData;

    use super::Sound;

    const VOICES: usize = 4;

    struct Voices {
        sounds: Vec<Retained<NSSound>>,
        next: usize,
    }

    thread_local! {
        static CACHE: RefCell<HashMap<Sound, Voices>> = RefCell::new(HashMap::new());
    }

    fn load(sound: Sound) -> Option<Voices> {
        let data = NSData::with_bytes(sound.bytes());
        let sounds: Option<Vec<_>> = (0..VOICES)
            .map(|_| NSSound::initWithData(NSSound::alloc(), &data))
            .collect();
        sounds.map(|sounds| Voices { sounds, next: 0 })
    }

    pub fn play(sound: Sound) {
        CACHE.with(|cache| {
            let mut cache = cache.borrow_mut();
            let voices = match cache.entry(sound) {
                Entry::Occupied(e) => e.into_mut(),
                Entry::Vacant(v) => match load(sound) {
                    Some(voices) => v.insert(voices),
                    None => {
                        log::warn!("sound: could not decode {sound:?}");
                        return;
                    }
                },
            };
            let s = &voices.sounds[voices.next];
            voices.next = (voices.next + 1) % VOICES;
            if s.isPlaying() {
                s.stop();
            }
            if !s.play() {
                log::warn!("sound: NSSound play returned false for {sound:?}");
            }
        });
    }
}

#[cfg(windows)]
fn play(_app: &AppHandle, sound: Sound) {
    use ::windows::core::PCWSTR;
    use ::windows::Win32::Media::Audio::{PlaySoundW, SND_ASYNC, SND_MEMORY, SND_NODEFAULT};
    let ok = unsafe {
        PlaySoundW(
            PCWSTR(sound.bytes().as_ptr().cast()),
            None,
            SND_MEMORY | SND_ASYNC | SND_NODEFAULT,
        )
    };
    if !ok.as_bool() {
        log::warn!("sound: PlaySoundW failed for {sound:?}");
    }
}
