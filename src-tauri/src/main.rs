#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod vault;
mod import;
mod raw;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      vault::get_vault_path,
      vault::set_vault_path,
      vault::ensure_account_folder,
      vault::read_manifest,
      vault::write_manifest,
      import::run_import,
      raw::list_raw_tree,
      raw::read_text_file,
      raw::reveal_in_os,
      raw::open_in_os
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
