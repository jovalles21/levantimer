use tauri::{
  menu::{Menu, MenuItem},
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  Manager,
};

/// Milisegundos desde el último evento de teclado/ratón a nivel de sistema.
/// El frontend lo consulta para la auto-pausa por inactividad.
#[tauri::command]
fn get_idle_ms() -> u64 {
  user_idle::UserIdle::get_time()
    .map(|t| t.as_seconds() * 1000)
    .unwrap_or(0)
}

/// Actualiza el texto junto al icono en la barra de menú (p. ej. "⏱ 29:45").
/// Lo llama el frontend en cada tick del timer; vacío lo oculta.
#[tauri::command]
fn set_tray_title(app: tauri::AppHandle, title: String) {
  if let Some(tray) = app.tray_by_id("main") {
    let _ = tray.set_title(if title.is_empty() { None } else { Some(title.as_str()) });
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![set_tray_title, get_idle_ms])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let quit = MenuItem::with_id(app, "quit", "Salir de Levantimer", true, None::<&str>)?;
      let menu = Menu::with_items(app, &[&quit])?;

      TrayIconBuilder::with_id("main")
        .icon(app.default_window_icon().unwrap().clone())
        .icon_as_template(true)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
          if event.id() == "quit" {
            app.exit(0);
          }
        })
        .on_tray_icon_event(|tray, event| {
          // Clic izquierdo en el tray: muestra la ventana.
          if let TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
          } = event
          {
            let app = tray.app_handle();
            if let Some(window) = app.get_webview_window("main") {
              let _ = window.show();
              let _ = window.set_focus();
            }
          }
        })
        .build(app)?;

      Ok(())
    })
    // Cerrar la ventana solo la oculta: el timer sigue vivo en la barra de menú.
    .on_window_event(|window, event| {
      if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        let _ = window.hide();
        api.prevent_close();
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
