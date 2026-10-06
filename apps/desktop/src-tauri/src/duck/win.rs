use windows::core::Interface;
use windows::Win32::Media::Audio::{
    eConsole, eRender, IAudioSessionControl2, IAudioSessionManager2, IMMDeviceEnumerator, ISimpleAudioVolume,
    MMDeviceEnumerator,
};
use windows::Win32::System::Com::{CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_MULTITHREADED};

#[derive(Default)]
pub struct Win {
    com: bool,
    sessions: Vec<(ISimpleAudioVolume, f32)>,
}

impl super::Backend for Win {
    fn start(&mut self) -> Result<(), String> {
        self.restore();
        if !self.com {
            unsafe { CoInitializeEx(None, COINIT_MULTITHREADED) }
                .ok()
                .map_err(|e| format!("CoInitializeEx: {e}"))?;
            self.com = true;
        }
        self.sessions = unsafe { snapshot() }.map_err(|e| format!("sessions: {e}"))?;
        Ok(())
    }

    fn ready(&mut self) -> bool {
        !self.sessions.is_empty()
    }

    fn apply(&mut self, gain: f32) {
        for (vol, orig) in &self.sessions {
            let _ = unsafe { vol.SetMasterVolume(orig * gain.clamp(0.0, 1.0), std::ptr::null()) };
        }
    }

    fn healthy(&mut self) -> bool {
        true
    }

    fn stop(&mut self) {
        self.restore();
    }
}

impl Win {
    fn restore(&mut self) {
        for (vol, orig) in self.sessions.drain(..) {
            if let Err(e) = unsafe { vol.SetMasterVolume(orig, std::ptr::null()) } {
                log::warn!("duck: restore session volume failed: {e}");
            }
        }
    }
}

impl Drop for Win {
    fn drop(&mut self) {
        self.restore();
    }
}

unsafe fn snapshot() -> windows::core::Result<Vec<(ISimpleAudioVolume, f32)>> {
    let me = std::process::id();
    unsafe {
        let enumerator: IMMDeviceEnumerator = CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)?;
        let device = enumerator.GetDefaultAudioEndpoint(eRender, eConsole)?;
        let manager: IAudioSessionManager2 = device.Activate(CLSCTX_ALL, None)?;
        let list = manager.GetSessionEnumerator()?;
        let mut out = Vec::new();
        for i in 0..list.GetCount()? {
            let Ok(control) = list.GetSession(i) else { continue };
            let Ok(control2) = control.cast::<IAudioSessionControl2>() else {
                continue;
            };
            let system = control2.IsSystemSoundsSession() == windows::Win32::Foundation::S_OK;
            let Ok(pid) = control2.GetProcessId() else { continue };
            if !super::duckable_session(pid, me, system) {
                continue;
            }
            let Ok(vol) = control.cast::<ISimpleAudioVolume>() else {
                continue;
            };
            let Ok(orig) = vol.GetMasterVolume() else { continue };
            out.push((vol, orig));
        }
        Ok(out)
    }
}
