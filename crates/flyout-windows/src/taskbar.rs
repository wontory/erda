use std::{
    ffi::c_void,
    sync::{
        atomic::{AtomicBool, AtomicIsize, Ordering},
        OnceLock,
    },
};

use flyout::Toggle;
use tauri::AppHandle;
use windows::{
    core::{w, HSTRING, PCWSTR},
    Win32::{
        Foundation::{GetLastError, COLORREF, HINSTANCE, HWND, LPARAM, LRESULT, WPARAM},
        System::LibraryLoader::GetModuleHandleW,
        UI::WindowsAndMessaging::*,
    },
};

const CLASS_NAME: PCWSTR = w!("ErdaTaskbarButton");
const APP_ICON_ID: usize = 32512;
const OFFSCREEN: i32 = -32000;

struct Button {
    app: AppHandle,
    on_click: Toggle,
}

static BUTTON: OnceLock<Button> = OnceLock::new();
static HANDLE: AtomicIsize = AtomicIsize::new(0);
static READY: AtomicBool = AtomicBool::new(false);

pub fn create(app: &AppHandle, on_click: Toggle) {
    let button = Button {
        app: app.clone(),
        on_click,
    };
    if BUTTON.set(button).is_err() {
        return log::warn!("flyout-windows: taskbar button already created");
    }
    let instance: HINSTANCE = match unsafe { GetModuleHandleW(None) } {
        Ok(module) => module.into(),
        Err(e) => return log::warn!("flyout-windows: GetModuleHandleW failed: {e}; no taskbar button"),
    };
    let icon = match unsafe { LoadIconW(Some(instance), PCWSTR(APP_ICON_ID as *const u16)) } {
        Ok(icon) => icon,
        Err(e) => {
            log::warn!("flyout-windows: LoadIconW failed: {e}; taskbar button uses the default icon");
            HICON::default()
        }
    };
    let class = WNDCLASSEXW {
        cbSize: size_of::<WNDCLASSEXW>() as u32,
        lpfnWndProc: Some(wndproc),
        hInstance: instance,
        hIcon: icon,
        hIconSm: icon,
        lpszClassName: CLASS_NAME,
        ..Default::default()
    };
    if unsafe { RegisterClassExW(&class) } == 0 {
        let err = unsafe { GetLastError() };
        return log::warn!("flyout-windows: RegisterClassExW failed: {err:?}; no taskbar button");
    }
    let created = unsafe {
        CreateWindowExW(
            WS_EX_APPWINDOW | WS_EX_LAYERED,
            CLASS_NAME,
            w!("Erda"),
            WS_CAPTION | WS_SYSMENU | WS_MINIMIZEBOX | WS_MINIMIZE,
            OFFSCREEN,
            OFFSCREEN,
            1,
            1,
            None,
            None,
            Some(instance),
            None,
        )
    };
    let hwnd = match created {
        Ok(hwnd) => hwnd,
        Err(e) => return log::warn!("flyout-windows: CreateWindowExW failed: {e}; no taskbar button"),
    };
    if let Err(e) = unsafe { SetLayeredWindowAttributes(hwnd, COLORREF(0), 0, LWA_ALPHA) } {
        log::warn!("flyout-windows: SetLayeredWindowAttributes failed: {e}");
    }
    let _ = unsafe { ShowWindow(hwnd, SW_SHOWMINNOACTIVE) };
    HANDLE.store(hwnd.0 as isize, Ordering::Relaxed);
    READY.store(true, Ordering::Relaxed);
}

pub fn set_title(text: &str) {
    let raw = HANDLE.load(Ordering::Relaxed);
    if raw == 0 {
        return;
    }
    let title = HSTRING::from(if text.is_empty() { "Erda" } else { text });
    if let Err(e) = unsafe { SetWindowTextW(HWND(raw as *mut c_void), &title) } {
        log::warn!("flyout-windows: taskbar SetWindowTextW failed: {e}");
    }
}

fn on_main_thread(what: &'static str, f: impl FnOnce(&Button) + Send + 'static) {
    let Some(button) = BUTTON.get() else {
        return;
    };
    let result = button.app.run_on_main_thread(move || {
        if let Some(button) = BUTTON.get() {
            f(button);
        }
    });
    if let Err(e) = result {
        log::warn!("flyout-windows: taskbar {what}: run_on_main_thread failed: {e}");
    }
}

fn clicked() {
    on_main_thread("click", |b| (b.on_click)(&b.app));
}

fn quit() {
    on_main_thread("quit", |b| b.app.exit(0));
}

unsafe extern "system" fn wndproc(hwnd: HWND, msg: u32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    match msg {
        WM_SYSCOMMAND => match wparam.0 as u32 & 0xFFF0 {
            SC_RESTORE | SC_MAXIMIZE | SC_MINIMIZE => {
                clicked();
                return LRESULT(0);
            }
            SC_CLOSE => {
                quit();
                return LRESULT(0);
            }
            _ => {}
        },
        WM_SIZE if READY.load(Ordering::Relaxed) && wparam.0 as u32 != SIZE_MINIMIZED => {
            let _ = unsafe { ShowWindowAsync(hwnd, SW_SHOWMINNOACTIVE) };
            clicked();
            return LRESULT(0);
        }
        WM_CLOSE => {
            quit();
            return LRESULT(0);
        }
        _ => {}
    }
    unsafe { DefWindowProcW(hwnd, msg, wparam, lparam) }
}
