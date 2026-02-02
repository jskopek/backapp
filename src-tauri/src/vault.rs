use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct Settings {
  vault_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Manifest {
  pub schema_version: u32,
  pub plugin_id: String,
  pub account_id: String,
  pub display_name: Option<String>,
  pub created_at: String,
  pub last_import_at: Option<String>,
  pub last_import_status: Option<String>,
  #[serde(default)]
  pub source_fingerprints: Vec<String>,
}

fn app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
  app
    .path_resolver()
    .app_data_dir()
    .ok_or_else(|| "Unable to resolve app data dir".to_string())
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
  Ok(app_data_dir(app)?.join("settings.json"))
}

fn default_vault_path(app: &AppHandle) -> Result<PathBuf, String> {
  Ok(app_data_dir(app)?.join("Vault"))
}

fn load_settings(app: &AppHandle) -> Result<Settings, String> {
  let path = settings_path(app)?;
  let parent = path
    .parent()
    .ok_or_else(|| "Invalid settings path".to_string())?;

  if !parent.exists() {
    fs::create_dir_all(parent).map_err(|e| format!("create settings dir: {e}"))?;
  }

  if !path.exists() {
    return Ok(Settings::default());
  }

  let raw = fs::read_to_string(&path).map_err(|e| format!("read settings: {e}"))?;
  serde_json::from_str(&raw).map_err(|e| format!("parse settings: {e}"))
}

fn save_settings(app: &AppHandle, settings: &Settings) -> Result<(), String> {
  let path = settings_path(app)?;
  let parent = path
    .parent()
    .ok_or_else(|| "Invalid settings path".to_string())?;
  if !parent.exists() {
    fs::create_dir_all(parent).map_err(|e| format!("create settings dir: {e}"))?;
  }
  let raw = serde_json::to_string_pretty(settings)
    .map_err(|e| format!("serialize settings: {e}"))?;
  fs::write(&path, raw).map_err(|e| format!("write settings: {e}"))
}

pub(crate) fn resolve_vault_path_for_import(app: &AppHandle) -> Result<PathBuf, String> {
  let settings = load_settings(app)?;

  let path = match settings.vault_path {
    Some(p) if !p.trim().is_empty() => PathBuf::from(p),
    _ => default_vault_path(app)?,
  };

  if !path.exists() {
    fs::create_dir_all(&path).map_err(|e| format!("create vault dir: {e}"))?;
  }

  Ok(path)
}

fn resolve_vault_path(app: &AppHandle) -> Result<PathBuf, String> {
  resolve_vault_path_for_import(app)
}

fn account_root(vault: &Path, plugin_id: &str, account_id: &str) -> PathBuf {
  vault.join(plugin_id).join(account_id)
}

fn manifest_path(vault: &Path, plugin_id: &str, account_id: &str) -> PathBuf {
  account_root(vault, plugin_id, account_id).join("manifest.json")
}

pub(crate) fn read_manifest_inner(
  vault: &Path,
  plugin_id: &str,
  account_id: &str,
) -> Result<Option<Manifest>, String> {
  let path = manifest_path(vault, plugin_id, account_id);
  if !path.exists() {
    return Ok(None);
  }
  let raw = fs::read_to_string(&path).map_err(|e| format!("read manifest: {e}"))?;
  let manifest: Manifest =
    serde_json::from_str(&raw).map_err(|e| format!("parse manifest: {e}"))?;
  Ok(Some(manifest))
}

pub(crate) fn write_manifest_inner(vault: &Path, manifest: &Manifest) -> Result<(), String> {
  let root = account_root(vault, &manifest.plugin_id, &manifest.account_id);
  fs::create_dir_all(root.join("raw")).map_err(|e| format!("create raw dir: {e}"))?;
  fs::create_dir_all(root.join("logs")).map_err(|e| format!("create logs dir: {e}"))?;
  let path = root.join("manifest.json");
  let raw = serde_json::to_string_pretty(&manifest)
    .map_err(|e| format!("serialize manifest: {e}"))?;
  fs::write(&path, raw).map_err(|e| format!("write manifest: {e}"))
}

#[tauri::command]
pub fn get_vault_path(app: AppHandle) -> Result<String, String> {
  Ok(resolve_vault_path(&app)?.to_string_lossy().to_string())
}

#[tauri::command]
pub fn set_vault_path(app: AppHandle, path: String) -> Result<(), String> {
  let trimmed = path.trim();
  if trimmed.is_empty() {
    return Err("Vault path cannot be empty".to_string());
  }

  let pb = PathBuf::from(trimmed);
  fs::create_dir_all(&pb).map_err(|e| format!("create vault dir: {e}"))?;

  let mut settings = load_settings(&app)?;
  settings.vault_path = Some(pb.to_string_lossy().to_string());
  save_settings(&app, &settings)
}

#[tauri::command]
pub fn ensure_account_folder(
  app: AppHandle,
  plugin_id: String,
  account_id: String,
) -> Result<String, String> {
  let vault = resolve_vault_path(&app)?;
  let root = account_root(&vault, &plugin_id, &account_id);

  fs::create_dir_all(root.join("raw")).map_err(|e| format!("create raw dir: {e}"))?;
  fs::create_dir_all(root.join("logs")).map_err(|e| format!("create logs dir: {e}"))?;

  let index_path = root.join("index.sqlite");
  if !index_path.exists() {
    fs::write(&index_path, "")
      .map_err(|e| format!("create index.sqlite placeholder: {e}"))?;
  }

  Ok(root.to_string_lossy().to_string())
}

#[tauri::command]
pub fn read_manifest(
  app: AppHandle,
  plugin_id: String,
  account_id: String,
) -> Result<Option<Manifest>, String> {
  let vault = resolve_vault_path(&app)?;
  read_manifest_inner(&vault, &plugin_id, &account_id)
}

#[tauri::command]
pub fn write_manifest(app: AppHandle, manifest: Manifest) -> Result<(), String> {
  let vault = resolve_vault_path(&app)?;
  write_manifest_inner(&vault, &manifest)
}
