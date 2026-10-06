use flyout::Flyout;

#[cfg(not(any(target_os = "macos", windows)))]
compile_error!("Erda supports only macOS and Windows.");

#[cfg(target_os = "macos")]
pub fn make_flyout() -> Box<dyn Flyout> {
    Box::new(flyout_macos::MacFlyout::default())
}

#[cfg(windows)]
pub fn make_flyout() -> Box<dyn Flyout> {
    Box::new(flyout_windows::WindowsFlyout::default())
}

pub fn register<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::Builder<R> {
    #[cfg(target_os = "macos")]
    {
        builder.plugin(flyout_macos::plugin())
    }
    #[cfg(not(target_os = "macos"))]
    {
        builder
    }
}
