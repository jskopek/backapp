#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod vault;
mod import;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      vault::get_vault_path,
      vault::set_vault_path,
      vault::ensure_account_folder,
      vault::read_manifest,
      vault::write_manifest,
      import::run_import
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
