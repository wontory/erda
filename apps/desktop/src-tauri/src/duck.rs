use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{self, Receiver, RecvTimeoutError, Sender};
use std::sync::OnceLock;
use std::time::{Duration, Instant};

#[cfg(target_os = "macos")]
mod mac;
#[cfg(windows)]
mod win;

pub const PREPARE_LEAD: Duration = Duration::from_millis(1500);
pub const HOLD: Duration = Duration::from_millis(2200);

const DUCK_GAIN: f32 = 0.15;
const HUD_MOTION: Duration = Duration::from_millis(160);
const DOWN: Duration = HUD_MOTION;
const UP: Duration = HUD_MOTION;
const EASE_OUT: [f32; 4] = [0.0, 0.0, 0.58, 1.0];
const EASE_IN: [f32; 4] = [0.42, 0.0, 1.0, 1.0];
const STEP: Duration = Duration::from_millis(10);
const CHECK: Duration = Duration::from_millis(50);

pub fn prepare(for_: Duration) {
    send_until(for_, Msg::Prepare);
}

pub fn hold(for_: Duration) {
    send_until(for_, Msg::Hold);
}

pub fn release() {
    if is_shut_down() {
        return;
    }
    if let Some(tx) = running_worker() {
        let _ = tx.send(Msg::Release);
    }
}

pub fn shutdown() {
    SHUT.store(true, Ordering::Release);
    let Some(tx) = running_worker() else { return };
    let (ack_tx, ack_rx) = mpsc::channel();
    if tx.send(Msg::Shutdown(ack_tx)).is_ok() {
        let _ = ack_rx.recv_timeout(Duration::from_secs(1));
    }
}

fn send_until(for_: Duration, msg: fn(Instant) -> Msg) {
    if is_shut_down() {
        return;
    }
    let Some(tx) = worker() else { return };
    if let Some(until) = Instant::now().checked_add(for_) {
        let _ = tx.send(msg(until));
    }
}

enum Msg {
    Prepare(Instant),
    Hold(Instant),
    Release,
    Shutdown(Sender<()>),
}

static SHUT: AtomicBool = AtomicBool::new(false);
static WORKER: OnceLock<Option<Sender<Msg>>> = OnceLock::new();

fn is_shut_down() -> bool {
    SHUT.load(Ordering::Acquire)
}

fn running_worker() -> Option<&'static Sender<Msg>> {
    WORKER.get().and_then(Option::as_ref)
}

fn worker() -> Option<&'static Sender<Msg>> {
    WORKER.get_or_init(spawn_worker).as_ref()
}

fn spawn_worker() -> Option<Sender<Msg>> {
    if !platform_supported() {
        return None;
    }
    let (tx, rx) = mpsc::channel();
    match std::thread::Builder::new()
        .name("erda-duck".into())
        .spawn(move || run_worker(rx))
    {
        Ok(_) => Some(tx),
        Err(e) => {
            log::warn!("duck: could not spawn worker: {e}");
            None
        }
    }
}

#[cfg(target_os = "macos")]
type PlatformBackend = mac::Mac;

#[cfg(windows)]
type PlatformBackend = win::Win;

#[cfg(not(any(target_os = "macos", windows)))]
type PlatformBackend = NoBackend;

#[cfg(target_os = "macos")]
fn platform_supported() -> bool {
    let ok = mac::supported();
    if !ok {
        log::info!("duck: process taps need macOS 14.2+; ducking disabled");
    }
    ok
}

#[cfg(windows)]
fn platform_supported() -> bool {
    true
}

#[cfg(not(any(target_os = "macos", windows)))]
fn platform_supported() -> bool {
    false
}

#[cfg(not(any(target_os = "macos", windows)))]
#[derive(Default)]
struct NoBackend;

#[cfg(not(any(target_os = "macos", windows)))]
impl Backend for NoBackend {
    fn start(&mut self) -> Result<(), String> {
        Err("unsupported".into())
    }
    fn ready(&mut self) -> bool {
        false
    }
    fn apply(&mut self, _gain: f32) {}
    fn healthy(&mut self) -> bool {
        false
    }
    fn stop(&mut self) {}
}

#[cfg(target_os = "macos")]
fn tap_exclusion(own_process_object: u32) -> Option<[u32; 1]> {
    (own_process_object != 0).then_some([own_process_object])
}

#[cfg(windows)]
fn duckable_session(pid: u32, own_pid: u32, system_sounds: bool) -> bool {
    pid != own_pid && pid != 0 && !system_sounds
}

fn run_worker(rx: Receiver<Msg>) {
    loop {
        let served = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            serve(&rx, Ducker::new(PlatformBackend::default()), Instant::now)
        }));
        match served {
            Ok(()) => return,
            Err(_) => log::error!("duck: worker panicked; restored and restarting"),
        }
    }
}

fn serve<B: Backend>(rx: &Receiver<Msg>, mut d: Ducker<B>, now: impl Fn() -> Instant) {
    loop {
        let msg = match d.tick(now()) {
            None => rx.recv().map_err(|_| RecvTimeoutError::Disconnected),
            Some(wait) => rx.recv_timeout(wait),
        };
        match msg {
            Ok(Msg::Prepare(until)) => d.prepare(now(), until),
            Ok(Msg::Hold(until)) => d.hold(now(), until),
            Ok(Msg::Release) => d.release(now()),
            Ok(Msg::Shutdown(ack)) => {
                d.abort();
                let _ = ack.send(());
                return;
            }
            Err(RecvTimeoutError::Timeout) => {}
            Err(RecvTimeoutError::Disconnected) => {
                d.abort();
                return;
            }
        }
    }
}

trait Backend {
    fn start(&mut self) -> Result<(), String>;
    fn ready(&mut self) -> bool;
    fn apply(&mut self, gain: f32);
    fn healthy(&mut self) -> bool;
    fn stop(&mut self);
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Phase {
    Idle,
    Arming,
    Ready,
    Down { start: Instant, from: f32 },
    Held,
    Up { start: Instant, from: f32 },
}

struct Ducker<B: Backend> {
    backend: B,
    phase: Phase,
    keep: Option<Instant>,
    duck: Option<Instant>,
    gain: f32,
    blocked: bool,
}

fn extend(deadline: &mut Option<Instant>, until: Instant) {
    *deadline = Some(deadline.map_or(until, |d| d.max(until)));
}

fn time_left(deadline: Option<Instant>, now: Instant) -> Duration {
    deadline.map_or(Duration::ZERO, |d| d.saturating_duration_since(now))
}

impl<B: Backend> Ducker<B> {
    fn new(backend: B) -> Self {
        Self {
            backend,
            phase: Phase::Idle,
            keep: None,
            duck: None,
            gain: 1.0,
            blocked: false,
        }
    }

    fn prepare(&mut self, now: Instant, until: Instant) {
        if until <= now {
            return;
        }
        extend(&mut self.keep, until);
        if self.phase == Phase::Idle && !self.blocked {
            self.arm();
        }
    }

    fn arm(&mut self) {
        match self.backend.start() {
            Ok(()) => self.phase = Phase::Arming,
            Err(e) => {
                log::warn!("duck: start failed: {e}");
                self.backend.stop();
                self.blocked = true;
            }
        }
    }

    fn hold(&mut self, now: Instant, until: Instant) {
        if until <= now {
            return;
        }
        self.prepare(now, until);
        extend(&mut self.duck, until);
        if matches!(self.phase, Phase::Ready | Phase::Up { .. }) {
            self.ramp_down(now);
        }
    }

    fn release(&mut self, now: Instant) {
        self.duck = None;
        if self.keep.is_some() {
            self.keep = Some(now);
        }
    }

    fn tick(&mut self, now: Instant) -> Option<Duration> {
        let ducking = self.duck.is_some_and(|d| now < d);
        let alive = ducking || self.keep.is_some_and(|k| now < k);
        if !ducking {
            self.duck = None;
        }
        if self.phase != Phase::Idle && !self.backend.healthy() {
            log::warn!("duck: backend unhealthy; restoring now");
            self.finish();
            self.blocked = alive;
        }
        let phase = self.phase;
        match phase {
            Phase::Idle if alive => Some(time_left(self.keep, now)),
            Phase::Idle => {
                self.keep = None;
                self.blocked = false;
                None
            }
            Phase::Arming if !alive => {
                self.finish();
                None
            }
            Phase::Arming if self.backend.ready() => {
                if ducking {
                    self.ramp_down(now);
                } else {
                    self.phase = Phase::Ready;
                }
                self.tick(now)
            }
            Phase::Arming => Some(self.next_keep_check(now)),
            Phase::Ready if ducking => {
                self.ramp_down(now);
                self.tick(now)
            }
            Phase::Ready if !alive => {
                self.finish_and_forget();
                None
            }
            Phase::Ready => Some(self.next_keep_check(now)),
            Phase::Down { .. } | Phase::Held if !ducking => {
                self.ramp_up(now);
                self.tick(now)
            }
            Phase::Down { start, from } => {
                if !self.step_ramp(from, DUCK_GAIN, DOWN, EASE_OUT, now.saturating_duration_since(start)) {
                    return Some(STEP);
                }
                self.phase = Phase::Held;
                Some(self.next_duck_check(now))
            }
            Phase::Held => Some(self.next_duck_check(now)),
            Phase::Up { start, from } => {
                if !self.step_ramp(from, 1.0, UP, EASE_IN, now.saturating_duration_since(start)) {
                    return Some(STEP);
                }
                if alive {
                    self.phase = Phase::Ready;
                    return Some(self.next_keep_check(now));
                }
                self.finish_and_forget();
                None
            }
        }
    }

    fn step_ramp(&mut self, from: f32, to: f32, full: Duration, curve: [f32; 4], elapsed: Duration) -> bool {
        let (gain, done) = ramp(from, to, full, curve, elapsed);
        self.set_gain(gain);
        done
    }

    fn ramp_down(&mut self, now: Instant) {
        self.phase = Phase::Down {
            start: now,
            from: self.gain,
        };
    }

    fn ramp_up(&mut self, now: Instant) {
        self.phase = Phase::Up {
            start: now,
            from: self.gain,
        };
    }

    fn abort(&mut self) {
        if self.phase != Phase::Idle {
            self.finish();
        }
        self.keep = None;
        self.duck = None;
    }

    fn finish(&mut self) {
        self.backend.stop();
        self.gain = 1.0;
        self.phase = Phase::Idle;
    }

    fn finish_and_forget(&mut self) {
        self.finish();
        self.keep = None;
    }

    fn set_gain(&mut self, g: f32) {
        if g != self.gain {
            self.gain = g;
            self.backend.apply(g);
        }
    }

    fn next_keep_check(&self, now: Instant) -> Duration {
        CHECK.min(time_left(self.keep, now))
    }

    fn next_duck_check(&self, now: Instant) -> Duration {
        CHECK.min(time_left(self.duck, now))
    }
}

fn ramp(from: f32, to: f32, full: Duration, curve: [f32; 4], elapsed: Duration) -> (f32, bool) {
    let span = (to - from).abs() / (1.0 - DUCK_GAIN);
    let total = full.as_secs_f32() * span.min(1.0);
    if total <= 0.0 || elapsed.as_secs_f32() >= total {
        return (to, true);
    }
    let s = cubic_bezier(curve, elapsed.as_secs_f32() / total);
    (from + (to - from) * s, false)
}

fn cubic_bezier([x1, y1, x2, y2]: [f32; 4], x: f32) -> f32 {
    let bez = |a: f32, b: f32, t: f32| {
        let u = 1.0 - t;
        3.0 * u * u * t * a + 3.0 * u * t * t * b + t * t * t
    };
    let (mut lo, mut hi) = (0.0f32, 1.0f32);
    for _ in 0..24 {
        let mid = (lo + hi) / 2.0;
        if bez(x1, x2, mid) < x {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    bez(y1, y2, (lo + hi) / 2.0)
}
