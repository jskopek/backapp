#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod vault;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      vault::get_vault_path,
      vault::set_vault_path,
      vault::ensure_account_folder,
      vault::read_manifest,
      vault::write_manifest
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
