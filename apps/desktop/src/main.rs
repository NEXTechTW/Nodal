#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

//! Nodal desktop shell (Tauri 2). The web editor is the product; this shell
//! only adds native windows and file dialogs. All map logic lives in the
//! TypeScript packages — this binary stays intentionally thin.

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Bundled font note: Noto Sans (SIL OFL) ships with the shell.
            // The editor falls back to system fonts in the browser.
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_title("Nodal — Transit map editor");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Nodal");
}
