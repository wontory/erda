use std::ffi::{c_void, CStr};
use std::ptr::{self, NonNull};
use std::sync::atomic::{AtomicBool, AtomicU32, AtomicU64, Ordering::Relaxed};
use std::sync::OnceLock;
use std::time::{Duration, Instant};

use objc2::rc::Retained;
use objc2::runtime::{AnyClass, AnyObject};
use objc2::{AnyThread, Message};
use objc2_core_audio::{
    kAudioAggregateDeviceIsPrivateKey, kAudioAggregateDeviceMainSubDeviceKey, kAudioAggregateDeviceNameKey,
    kAudioAggregateDeviceSubDeviceListKey, kAudioAggregateDeviceTapAutoStartKey, kAudioAggregateDeviceTapListKey,
    kAudioAggregateDeviceUIDKey, kAudioDevicePropertyDeviceUID, kAudioDevicePropertyNominalSampleRate,
    kAudioHardwarePropertyDefaultOutputDevice, kAudioHardwarePropertyTranslatePIDToProcessObject,
    kAudioObjectPropertyElementMain, kAudioObjectPropertyScopeGlobal, kAudioObjectSystemObject, kAudioObjectUnknown,
    kAudioSubDeviceUIDKey, kAudioSubTapDriftCompensationKey, kAudioSubTapUIDKey, kAudioTapPropertyDescription,
    kAudioTapPropertyFormat, AudioDeviceCreateIOProcID, AudioDeviceDestroyIOProcID, AudioDeviceIOProcID,
    AudioDeviceStart, AudioDeviceStop, AudioHardwareCreateAggregateDevice, AudioHardwareDestroyAggregateDevice,
    AudioObjectGetPropertyData, AudioObjectID, AudioObjectPropertyAddress, AudioObjectPropertySelector,
    AudioObjectSetPropertyData, CATapDescription, CATapMuteBehavior,
};
use objc2_core_audio_types::{
    kAudioFormatFlagIsFloat, kAudioFormatLinearPCM, AudioBuffer, AudioBufferList, AudioStreamBasicDescription,
    AudioTimeStamp,
};
use objc2_core_foundation::CFDictionary;
use objc2_foundation::{NSArray, NSDictionary, NSNumber, NSString, NSUUID};

type OSStatus = i32;
type CreateTapFn = unsafe extern "C" fn(*const CATapDescription, *mut AudioObjectID) -> OSStatus;
type DestroyTapFn = unsafe extern "C" fn(AudioObjectID) -> OSStatus;

const SLEW: f64 = 0.03;
const STALL: Duration = Duration::from_millis(500);
const DEVICE_CHECK: Duration = Duration::from_millis(250);
const SETTLE_TIMEOUT: Duration = Duration::from_millis(100);
const FALLBACK_RATE: f64 = 48_000.0;
const MIN_RATE: f64 = 8_000.0;
const DEVICE_NAME: &str = "Erda ducking";
const UNITY: f32 = 1.0;

struct Api {
    create: CreateTapFn,
    destroy: DestroyTapFn,
}

fn api() -> Option<&'static Api> {
    static API: OnceLock<Option<Api>> = OnceLock::new();
    API.get_or_init(|| unsafe {
        let create = libc::dlsym(libc::RTLD_DEFAULT, c"AudioHardwareCreateProcessTap".as_ptr());
        let destroy = libc::dlsym(libc::RTLD_DEFAULT, c"AudioHardwareDestroyProcessTap".as_ptr());
        if create.is_null() || destroy.is_null() || AnyClass::get(c"CATapDescription").is_none() {
            return None;
        }
        Some(Api {
            create: std::mem::transmute::<*mut c_void, CreateTapFn>(create),
            destroy: std::mem::transmute::<*mut c_void, DestroyTapFn>(destroy),
        })
    })
    .as_ref()
}

pub fn supported() -> bool {
    api().is_some()
}

struct Shared {
    target: AtomicU32,
    current: AtomicU32,
    pass: AtomicBool,
    heard: AtomicBool,
    cycles: AtomicU64,
    step: f32,
}

impl Shared {
    fn new() -> Self {
        Shared {
            target: AtomicU32::new(UNITY.to_bits()),
            current: AtomicU32::new(UNITY.to_bits()),
            pass: AtomicBool::new(false),
            heard: AtomicBool::new(false),
            cycles: AtomicU64::new(0),
            step: 0.0,
        }
    }
}

fn load_gain(bits: &AtomicU32) -> f32 {
    f32::from_bits(bits.load(Relaxed))
}

fn store_gain(bits: &AtomicU32, gain: f32) {
    bits.store(gain.to_bits(), Relaxed);
}

fn system_object() -> AudioObjectID {
    kAudioObjectSystemObject as AudioObjectID
}

fn default_output_device() -> Result<AudioObjectID, OSStatus> {
    get::<_, ()>(system_object(), kAudioHardwarePropertyDefaultOutputDevice, None)
}

#[derive(Default)]
pub struct Mac {
    session: Option<Session>,
    waiting: bool,
}

fn own_process_object() -> AudioObjectID {
    let pid = std::process::id() as libc::pid_t;
    get(
        system_object(),
        kAudioHardwarePropertyTranslatePIDToProcessObject,
        Some(&pid),
    )
    .unwrap_or(kAudioObjectUnknown)
}

impl super::Backend for Mac {
    fn start(&mut self) -> Result<(), String> {
        self.stop();
        match super::tap_exclusion(own_process_object()) {
            Some([me]) => self.session = Some(Session::open(me)?),
            None => {
                log::debug!("duck: own process object not known yet; waiting");
                self.waiting = true;
            }
        }
        Ok(())
    }

    fn ready(&mut self) -> bool {
        if self.waiting {
            let Some([me]) = super::tap_exclusion(own_process_object()) else {
                return false;
            };
            self.waiting = false;
            match Session::open(me) {
                Ok(s) => self.session = Some(s),
                Err(e) => {
                    log::warn!("duck: start failed: {e}");
                    return false;
                }
            }
        }
        self.session.as_mut().is_some_and(Session::engage)
    }

    fn apply(&mut self, gain: f32) {
        if let Some(s) = &self.session {
            store_gain(&s.shared.target, gain.clamp(0.0, 1.0));
        }
    }

    fn healthy(&mut self) -> bool {
        self.waiting || self.session.as_mut().is_some_and(Session::healthy)
    }

    fn stop(&mut self) {
        self.waiting = false;
        if let Some(s) = self.session.take() {
            s.settle();
            if s.muted {
                log::info!("duck: restored other apps");
            }
        }
    }
}

struct Session {
    tap: AudioObjectID,
    desc: Retained<CATapDescription>,
    agg: AudioObjectID,
    proc_id: AudioDeviceIOProcID,
    started: bool,
    muted: bool,
    engage_failed: bool,
    out_dev: AudioObjectID,
    shared: Box<Shared>,
    last_cycles: u64,
    last_progress: Instant,
    last_device_check: Instant,
}

impl Session {
    fn open(me: AudioObjectID) -> Result<Session, String> {
        api().ok_or("process taps unavailable")?;
        let exclude = super::tap_exclusion(me).ok_or("own process object unknown")?;
        let desc = unsafe {
            let exclude = NSArray::from_retained_slice(&exclude.map(NSNumber::new_u32));
            CATapDescription::initStereoGlobalTapButExcludeProcesses(CATapDescription::alloc(), &exclude)
        };
        Self::open_tap(desc)
    }

    fn open_tap(desc: Retained<CATapDescription>) -> Result<Session, String> {
        let api = api().ok_or("process taps unavailable")?;
        let out_dev = default_output_device().map_err(|e| format!("default output: {e}"))?;
        if out_dev == kAudioObjectUnknown {
            return Err("no default output device".into());
        }
        let out_uid = cf_string(out_dev, kAudioDevicePropertyDeviceUID).ok_or("output device uid")?;
        unsafe {
            desc.setName(&NSString::from_str(DEVICE_NAME));
            desc.setPrivate(true);
            desc.setMuteBehavior(CATapMuteBehavior::Unmuted);
        }

        let mut s = Session {
            tap: kAudioObjectUnknown,
            desc,
            agg: kAudioObjectUnknown,
            proc_id: None,
            started: false,
            muted: false,
            engage_failed: false,
            out_dev,
            shared: Box::new(Shared::new()),
            last_cycles: 0,
            last_progress: Instant::now(),
            last_device_check: Instant::now(),
        };

        let mut tap = kAudioObjectUnknown;
        check(
            unsafe { (api.create)(Retained::as_ptr(&s.desc), &mut tap) },
            "create tap",
        )?;
        s.tap = tap;
        check_tap_format(tap)?;

        let tap_uid = unsafe { s.desc.UUID().UUIDString() };
        s.agg = create_aggregate(out_uid, tap_uid)?;

        let rate = nominal_rate(s.agg);
        s.shared.step = (1.0 / (rate * SLEW)) as f32;

        let mut proc_id: AudioDeviceIOProcID = None;
        let status = unsafe {
            AudioDeviceCreateIOProcID(
                s.agg,
                Some(io_proc),
                &*s.shared as *const Shared as *mut c_void,
                NonNull::from(&mut proc_id),
            )
        };
        check(status, "create ioproc")?;
        s.proc_id = proc_id;

        check(unsafe { AudioDeviceStart(s.agg, s.proc_id) }, "start")?;
        s.started = true;
        s.last_progress = Instant::now();
        s.last_device_check = Instant::now();
        log::debug!("duck: tap armed (unmuted) at {rate} Hz");
        Ok(s)
    }

    fn engage(&mut self) -> bool {
        if self.muted {
            return true;
        }
        if self.engage_failed || !self.shared.heard.load(Relaxed) {
            return false;
        }
        if let Err(e) = self.set_mute(CATapMuteBehavior::MutedWhenTapped) {
            log::warn!("duck: could not mute tap ({e}); not ducking");
            self.engage_failed = true;
            let _ = self.set_mute(CATapMuteBehavior::Unmuted);
            return false;
        }
        store_gain(&self.shared.current, UNITY);
        store_gain(&self.shared.target, UNITY);
        self.shared.pass.store(true, Relaxed);
        self.muted = true;
        log::info!("duck: ducking other apps");
        true
    }

    fn set_mute(&mut self, behavior: CATapMuteBehavior) -> Result<(), String> {
        unsafe { self.desc.setMuteBehavior(behavior) };
        let ptr: *const CATapDescription = Retained::as_ptr(&self.desc);
        let address = address(kAudioTapPropertyDescription);
        let status = unsafe {
            AudioObjectSetPropertyData(
                self.tap,
                NonNull::from(&address),
                0,
                ptr::null(),
                size_of::<*const CATapDescription>() as u32,
                NonNull::from(&ptr).cast(),
            )
        };
        check(status, "set tap description")?;
        let raw: *mut CATapDescription = get::<_, ()>(self.tap, kAudioTapPropertyDescription, None)
            .map_err(|e| format!("read tap description: {e}"))?;
        let back = unsafe { Retained::from_raw(raw) }.ok_or("null tap description")?;
        let now = unsafe { back.isMuted() };
        if now != behavior {
            return Err(format!("tap mute is {} not {}", now.0, behavior.0));
        }
        Ok(())
    }

    fn healthy(&mut self) -> bool {
        let now = Instant::now();
        let cycles = self.shared.cycles.load(Relaxed);
        if cycles != self.last_cycles || !self.muted {
            self.last_cycles = cycles;
            self.last_progress = now;
        } else if now.duration_since(self.last_progress) > STALL {
            log::info!("duck: audio IO idle while ducked");
            return false;
        }
        if now.duration_since(self.last_device_check) >= DEVICE_CHECK {
            self.last_device_check = now;
            if default_output_device() != Ok(self.out_dev) {
                log::info!("duck: default output changed");
                return false;
            }
        }
        true
    }

    fn settle(&self) {
        if !(self.muted && self.started) {
            return;
        }
        store_gain(&self.shared.target, UNITY);
        let until = Instant::now() + SETTLE_TIMEOUT;
        while load_gain(&self.shared.current) < 0.999 && Instant::now() < until {
            std::thread::sleep(Duration::from_millis(5));
        }
    }
}

fn check_tap_format(tap: AudioObjectID) -> Result<(), String> {
    let format: AudioStreamBasicDescription =
        get::<_, ()>(tap, kAudioTapPropertyFormat, None).map_err(|e| format!("tap format: {e}"))?;
    if format.mFormatID != kAudioFormatLinearPCM || format.mFormatFlags & kAudioFormatFlagIsFloat == 0 {
        return Err(format!(
            "unexpected tap format {:#x}/{:#x}",
            format.mFormatID, format.mFormatFlags
        ));
    }
    Ok(())
}

fn aggregate_description(
    out_uid: Retained<NSString>,
    tap_uid: Retained<NSString>,
) -> Retained<NSDictionary<NSString, AnyObject>> {
    let agg_uid = NSUUID::UUID().UUIDString();
    let sub = dict(&[(kAudioSubDeviceUIDKey, obj(out_uid.clone()))]);
    let tap_entry = dict(&[
        (kAudioSubTapUIDKey, obj(tap_uid)),
        (kAudioSubTapDriftCompensationKey, obj(NSNumber::new_bool(true))),
    ]);
    dict(&[
        (kAudioAggregateDeviceNameKey, obj(NSString::from_str(DEVICE_NAME))),
        (kAudioAggregateDeviceUIDKey, obj(agg_uid)),
        (kAudioAggregateDeviceMainSubDeviceKey, obj(out_uid)),
        (kAudioAggregateDeviceIsPrivateKey, obj(NSNumber::new_bool(true))),
        (kAudioAggregateDeviceTapAutoStartKey, obj(NSNumber::new_bool(true))),
        (
            kAudioAggregateDeviceSubDeviceListKey,
            obj(NSArray::from_retained_slice(&[sub])),
        ),
        (
            kAudioAggregateDeviceTapListKey,
            obj(NSArray::from_retained_slice(&[tap_entry])),
        ),
    ])
}

fn create_aggregate(out_uid: Retained<NSString>, tap_uid: Retained<NSString>) -> Result<AudioObjectID, String> {
    let desc = aggregate_description(out_uid, tap_uid);
    let mut agg = kAudioObjectUnknown;
    let status = unsafe {
        let cf = &*(Retained::as_ptr(&desc) as *const CFDictionary);
        AudioHardwareCreateAggregateDevice(cf, NonNull::from(&mut agg))
    };
    check(status, "create aggregate")?;
    Ok(agg)
}

fn nominal_rate(device: AudioObjectID) -> f64 {
    let rate: f64 = get::<_, ()>(device, kAudioDevicePropertyNominalSampleRate, None).unwrap_or(FALLBACK_RATE);
    if rate.is_finite() && rate >= MIN_RATE {
        rate
    } else {
        FALLBACK_RATE
    }
}

impl Drop for Session {
    fn drop(&mut self) {
        if self.muted {
            let _ = self.set_mute(CATapMuteBehavior::Unmuted);
        }
        self.shared.pass.store(false, Relaxed);
        unsafe {
            if self.started {
                warn_status(AudioDeviceStop(self.agg, self.proc_id), "stop");
            }
            if self.proc_id.is_some() {
                warn_status(AudioDeviceDestroyIOProcID(self.agg, self.proc_id), "destroy ioproc");
            }
            if self.agg != kAudioObjectUnknown {
                warn_status(AudioHardwareDestroyAggregateDevice(self.agg), "destroy aggregate");
            }
            if self.tap != kAudioObjectUnknown {
                if let Some(api) = api() {
                    warn_status((api.destroy)(self.tap), "destroy tap");
                }
            }
        }
    }
}

unsafe extern "C-unwind" fn io_proc(
    _device: AudioObjectID,
    _now: NonNull<AudioTimeStamp>,
    input: NonNull<AudioBufferList>,
    _input_time: NonNull<AudioTimeStamp>,
    output: NonNull<AudioBufferList>,
    _output_time: NonNull<AudioTimeStamp>,
    client: *mut c_void,
) -> OSStatus {
    let shared = unsafe { &*(client as *const Shared) };
    let (input, output) = unsafe { (buffers(input), buffers(output)) };
    shared.cycles.fetch_add(1, Relaxed);
    if !shared.heard.load(Relaxed) && input.iter().any(|b| samples(b).iter().any(|&x| x != 0.0)) {
        shared.heard.store(true, Relaxed);
    }
    if !shared.pass.load(Relaxed) {
        return 0;
    }
    let start = load_gain(&shared.current);
    let target = load_gain(&shared.target);
    let frames = mix(input, output, start, target, shared.step);
    store_gain(&shared.current, gain_at(start, target, shared.step, frames));
    0
}

fn mix(input: &[AudioBuffer], output: &[AudioBuffer], start: f32, target: f32, step: f32) -> usize {
    let in_ch = channel_count(input);
    let out_ch = channel_count(output);
    if in_ch == 0 || out_ch == 0 {
        return 0;
    }
    let frames = frame_count(input, output);
    let mut oc = 0;
    for ob in output {
        let n = ob.mNumberChannels as usize;
        if ob.mData.is_null() || n == 0 {
            oc += n;
            continue;
        }
        let out = unsafe { std::slice::from_raw_parts_mut(ob.mData as *mut f32, ob.mDataByteSize as usize / 4) };
        for ch in 0..n {
            let src = if out_ch == 1 { None } else { locate(input, oc + ch) };
            if out_ch != 1 && src.is_none() {
                continue;
            }
            for i in 0..frames {
                let x = match src {
                    Some((buf, c, stride)) => buf[i * stride + c],
                    None => {
                        (0..in_ch)
                            .filter_map(|g| locate(input, g))
                            .map(|(b, c, s)| b[i * s + c])
                            .sum::<f32>()
                            / in_ch as f32
                    }
                };
                out[i * n + ch] = x * gain_at(start, target, step, i + 1);
            }
        }
        oc += n;
    }
    frames
}

fn channel_count(buffers: &[AudioBuffer]) -> usize {
    buffers.iter().map(|b| b.mNumberChannels as usize).sum()
}

fn frame_count(input: &[AudioBuffer], output: &[AudioBuffer]) -> usize {
    input
        .iter()
        .chain(output)
        .filter(|b| b.mNumberChannels > 0)
        .map(|b| (b.mDataByteSize as usize / 4) / b.mNumberChannels as usize)
        .min()
        .unwrap_or(0)
}

fn locate(input: &[AudioBuffer], mut global: usize) -> Option<(&[f32], usize, usize)> {
    for b in input {
        let n = b.mNumberChannels as usize;
        if global < n {
            let s = samples(b);
            return (!s.is_empty()).then_some((s, global, n));
        }
        global -= n;
    }
    None
}

fn gain_at(start: f32, target: f32, step: f32, k: usize) -> f32 {
    let d = step * k as f32;
    if start < target {
        (start + d).min(target)
    } else {
        (start - d).max(target)
    }
}

unsafe fn buffers<'a>(list: NonNull<AudioBufferList>) -> &'a [AudioBuffer] {
    let list = list.as_ptr();
    unsafe {
        std::slice::from_raw_parts(
            (&raw const (*list).mBuffers).cast::<AudioBuffer>(),
            (*list).mNumberBuffers as usize,
        )
    }
}

fn samples(b: &AudioBuffer) -> &[f32] {
    if b.mData.is_null() {
        return &[];
    }
    unsafe { std::slice::from_raw_parts(b.mData as *const f32, b.mDataByteSize as usize / 4) }
}

fn address(selector: AudioObjectPropertySelector) -> AudioObjectPropertyAddress {
    AudioObjectPropertyAddress {
        mSelector: selector,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain,
    }
}

fn get<T: Copy, Q>(
    object: AudioObjectID,
    selector: AudioObjectPropertySelector,
    qualifier: Option<&Q>,
) -> Result<T, OSStatus> {
    let address = address(selector);
    let mut out = std::mem::MaybeUninit::<T>::zeroed();
    let mut size = size_of::<T>() as u32;
    let (q_size, q_ptr) = qualifier.map_or((0, ptr::null()), |q| {
        (size_of::<Q>() as u32, q as *const Q as *const c_void)
    });
    let status = unsafe {
        AudioObjectGetPropertyData(
            object,
            NonNull::from(&address),
            q_size,
            q_ptr,
            NonNull::from(&mut size),
            NonNull::from(&mut out).cast(),
        )
    };
    if status != 0 {
        return Err(status);
    }
    if size as usize != size_of::<T>() {
        return Err(-1);
    }
    Ok(unsafe { out.assume_init() })
}

fn cf_string(object: AudioObjectID, selector: AudioObjectPropertySelector) -> Option<Retained<NSString>> {
    let raw: *mut NSString = get::<_, ()>(object, selector, None).ok()?;
    unsafe { Retained::from_raw(raw) }
}

fn obj<T: Message>(r: Retained<T>) -> Retained<AnyObject> {
    unsafe { Retained::cast_unchecked(r) }
}

fn dict(entries: &[(&CStr, Retained<AnyObject>)]) -> Retained<NSDictionary<NSString, AnyObject>> {
    let keys: Vec<Retained<NSString>> = entries
        .iter()
        .map(|(k, _)| NSString::from_str(k.to_str().unwrap_or_default()))
        .collect();
    let keys: Vec<&NSString> = keys.iter().map(|k| &**k).collect();
    let values: Vec<Retained<AnyObject>> = entries.iter().map(|(_, v)| v.clone()).collect();
    NSDictionary::from_retained_objects(&keys, &values)
}

fn check(status: OSStatus, what: &str) -> Result<(), String> {
    if status == 0 {
        Ok(())
    } else {
        Err(format!("{what}: OSStatus {status}"))
    }
}

fn warn_status(status: OSStatus, what: &str) {
    if status != 0 {
        log::warn!("duck: {what} failed: OSStatus {status}");
    }
}
