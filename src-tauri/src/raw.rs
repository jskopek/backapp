use crate::vault;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Component, Path, PathBuf};
use tauri::{api::shell, AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawEntry {
  pub path: String, // relative (posix-like)
  pub name: String,
  pub is_dir: bool,
  pub size: Option<u64>,
  pub modified_ms: Option<u128>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListRawTreeArgs {
  pub plugin_id: String,
  pub account_id: String,
  pub subdir: Option<String>,
}

fn safe_rel_path(rel: &str) -> Result<PathBuf, String> {
  let p = Path::new(rel);
  let mut out = PathBuf::new();
  for c in p.components() {
    match c {
      Component::Normal(part) => out.push(part),
      Component::CurDir => {}
      _ => return Err("Invalid path".to_string()),
    }
  }
  Ok(out)
}

fn to_rel_string(path: &Path) -> String {
  // Always return forward slashes.
  path
    .components()
    .filter_map(|c| match c {
      Component::Normal(p) => Some(p.to_string_lossy().to_string()),
      _ => None,
    })
    .collect::<Vec<_>>()
    .join("/")
}

#[tauri::command]
pub fn list_raw_tree(app: AppHandle, args: ListRawTreeArgs) -> Result<Vec<RawEntry>, String> {
  let vault_path = vault::resolve_vault_path_for_import(&app)?;
  let raw_root = vault_path
    .join(&args.plugin_id)
    .join(&args.account_id)
    .join("raw");

  let sub = args.subdir.unwrap_or_else(|| "".to_string());
  let safe_sub = safe_rel_path(&sub)?;
  let target = raw_root.join(&safe_sub);

  if !target.exists() {
    return Ok(Vec::new());
  }
  if !target.is_dir() {
    return Err("Target is not a directory".to_string());
  }

  let mut out: Vec<RawEntry> = Vec::new();
  for entry in fs::read_dir(&target).map_err(|e| format!("read dir: {e}"))? {
    let entry = entry.map_err(|e| format!("read entry: {e}"))?;
    let path = entry.path();
    let meta = entry.metadata().map_err(|e| format!("metadata: {e}"))?;
    let is_dir = meta.is_dir();
    let name = entry.file_name().to_string_lossy().to_string();

    let rel = path
      .strip_prefix(&raw_root)
      .map_err(|_| "Failed to compute relative path".to_string())?;

    let modified_ms = meta
      .modified()
      .ok()
      .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
      .map(|d| d.as_millis());

    out.push(RawEntry {
      path: to_rel_string(rel),
      name,
      is_dir,
      size: if is_dir { None } else { Some(meta.len()) },
      modified_ms,
    });
  }

  // Sort dirs first, then by name.
  out.sort_by(|a, b| {
    match (a.is_dir, b.is_dir) {
      (true, false) => std::cmp::Ordering::Less,
      (false, true) => std::cmp::Ordering::Greater,
      _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    }
  });

  Ok(out)
}

#[tauri::command]
pub fn read_text_file(
  app: AppHandle,
  plugin_id: String,
  account_id: String,
  rel_path: String,
  max_bytes: Option<u64>,
) -> Result<String, String> {
  let vault_path = vault::resolve_vault_path_for_import(&app)?;
  let raw_root = vault_path
    .join(&plugin_id)
    .join(&account_id)
    .join("raw");

  let safe = safe_rel_path(&rel_path)?;
  let full = raw_root.join(safe);
  if !full.exists() {
    return Err("File does not exist".to_string());
  }
  if !full.is_file() {
    return Err("Not a file".to_string());
  }

  let bytes = fs::read(&full).map_err(|e| format!("read file: {e}"))?;
  let limit = max_bytes.unwrap_or(256 * 1024) as usize;
  let slice = if bytes.len() > limit { &bytes[..limit] } else { &bytes };
  Ok(String::from_utf8_lossy(slice).to_string())
}

#[tauri::command]
pub fn reveal_in_os(
  app: AppHandle,
  plugin_id: String,
  account_id: String,
  rel_path: String,
) -> Result<(), String> {
  let vault_path = vault::resolve_vault_path_for_import(&app)?;
  let raw_root = vault_path
    .join(&plugin_id)
    .join(&account_id)
    .join("raw");

  let safe = safe_rel_path(&rel_path)?;
  let full = raw_root.join(safe);
  if !full.exists() {
    return Err("Path does not exist".to_string());
  }

  // NOTE: "reveal in Finder/Explorer" isn't directly supported in Tauri v1
  // without OS-specific commands. This opens the file/folder instead.
  shell::open(&app.shell_scope(), full.to_string_lossy().to_string(), None)
    .map_err(|e| format!("open: {e}"))
}

#[tauri::command]
pub fn open_in_os(
  app: AppHandle,
  plugin_id: String,
  account_id: String,
  rel_path: String,
) -> Result<(), String> {
  // For now same as reveal; real "reveal" vs "open" is OS-specific.
  reveal_in_os(app, plugin_id, account_id, rel_path)
}
