#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      // 在这里可以添加其他设置
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
