use crate::vault;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexGooglePhotosArgs {
  pub account_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexGooglePhotosResult {
  pub indexed_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListGooglePhotosMediaArgs {
  pub account_id: String,
  pub limit: Option<u32>,
  pub offset: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaItem {
  pub id: String,
  pub path: String, // absolute path
  pub filename: String,
  pub mime_type: String,
  pub taken_at_ms: Option<i64>,
}

fn mime_from_ext(path: &Path) -> String {
  let ext = path
    .extension()
    .and_then(|e| e.to_str())
    .unwrap_or("")
    .to_lowercase();
  match ext.as_str() {
    "jpg" | "jpeg" => "image/jpeg",
    "png" => "image/png",
    "gif" => "image/gif",
    "webp" => "image/webp",
    "heic" => "image/heic",
    "mp4" => "video/mp4",
    "mov" => "video/quicktime",
    "m4v" => "video/x-m4v",
    _ => "application/octet-stream",
  }
  .to_string()
}

fn is_media_file(path: &Path) -> bool {
  let ext = path
    .extension()
    .and_then(|e| e.to_str())
    .unwrap_or("")
    .to_lowercase();
  matches!(
    ext.as_str(),
    "jpg" | "jpeg" | "png" | "gif" | "webp" | "heic" | "mp4" | "mov" | "m4v"
  )
}

fn sidecar_path_for_media(path: &Path) -> PathBuf {
  // Takeout sidecars are typically: <filename>.jpg.json
  let file_name = path
    .file_name()
    .map(|s| s.to_string_lossy().to_string())
    .unwrap_or_else(|| "".to_string());
  path
    .with_file_name(format!("{file_name}.json"))
}

fn read_taken_at_ms_from_sidecar(sidecar: &Path) -> Option<i64> {
  let raw = fs::read_to_string(sidecar).ok()?;
  let v: serde_json::Value = serde_json::from_str(&raw).ok()?;

  // Common keys:
  // photoTakenTime.timestamp (seconds as string)
  // creationTime.timestamp (seconds as string)
  let ts = v
    .get("photoTakenTime")
    .and_then(|x| x.get("timestamp"))
    .or_else(|| v.get("creationTime").and_then(|x| x.get("timestamp")))
    .and_then(|x| x.as_str())
    .and_then(|s| s.parse::<i64>().ok())?;
  Some(ts * 1000)
}

fn walk_files(root: &Path) -> Result<Vec<PathBuf>, String> {
  let mut out = Vec::new();
  if !root.exists() {
    return Ok(out);
  }
  let mut stack = vec![root.to_path_buf()];
  while let Some(dir) = stack.pop() {
    for entry in fs::read_dir(&dir).map_err(|e| format!("read dir: {e}"))? {
      let entry = entry.map_err(|e| format!("read dir entry: {e}"))?;
      let path = entry.path();
      let file_type = entry
        .file_type()
        .map_err(|e| format!("read file type: {e}"))?;
      if file_type.is_dir() {
        stack.push(path);
      } else if file_type.is_file() {
        out.push(path);
      }
    }
  }
  Ok(out)
}

fn ensure_schema(conn: &Connection) -> Result<(), String> {
  conn
    .execute_batch(
      r#"
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS media_items (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        taken_at_ms INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_media_taken_at ON media_items(taken_at_ms);
    "#,
    )
    .map_err(|e| format!("create schema: {e}"))?;
  Ok(())
}

#[tauri::command]
pub fn index_google_photos(
  app: AppHandle,
  args: IndexGooglePhotosArgs,
) -> Result<IndexGooglePhotosResult, String> {
  let vault_path = vault::resolve_vault_path_for_import(&app)?;
  let account_root = vault_path.join("google-photos").join(&args.account_id);
  let raw_root = account_root.join("raw");
  let sqlite_path = account_root.join("index.sqlite");

  if !account_root.exists() {
    return Err("Account folder does not exist".to_string());
  }

  let mut conn = Connection::open(sqlite_path).map_err(|e| format!("open sqlite: {e}"))?;
  ensure_schema(&conn)?;

  // Rebuild each time (v1).
  conn
    .execute("DELETE FROM media_items", [])
    .map_err(|e| format!("clear media_items: {e}"))?;

  let files = walk_files(&raw_root)?;
  let mut count: u64 = 0;

  let tx = conn
    .transaction()
    .map_err(|e| format!("begin tx: {e}"))?;

  for file in files {
    if !is_media_file(&file) {
      continue;
    }

    let filename = file
      .file_name()
      .map(|s| s.to_string_lossy().to_string())
      .unwrap_or_else(|| "".to_string());

    let taken_at_ms = read_taken_at_ms_from_sidecar(&sidecar_path_for_media(&file)).or_else(|| {
      fs::metadata(&file)
        .ok()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as i64)
    });

    let id = blake3::hash(file.to_string_lossy().as_bytes()).to_hex().to_string();
    let mime_type = mime_from_ext(&file);

    tx.execute(
      "INSERT OR REPLACE INTO media_items (id, path, filename, mime_type, taken_at_ms) VALUES (?1, ?2, ?3, ?4, ?5)",
      params![id, file.to_string_lossy().to_string(), filename, mime_type, taken_at_ms],
    )
    .map_err(|e| format!("insert media item: {e}"))?;
    count += 1;
  }

  tx.commit().map_err(|e| format!("commit tx: {e}"))?;

  Ok(IndexGooglePhotosResult { indexed_count: count })
}

#[tauri::command]
pub fn list_google_photos_media(
  app: AppHandle,
  args: ListGooglePhotosMediaArgs,
) -> Result<Vec<MediaItem>, String> {
  let vault_path = vault::resolve_vault_path_for_import(&app)?;
  let account_root = vault_path.join("google-photos").join(&args.account_id);
  let sqlite_path = account_root.join("index.sqlite");
  let conn = Connection::open(sqlite_path).map_err(|e| format!("open sqlite: {e}"))?;
  ensure_schema(&conn)?;

  let limit = args.limit.unwrap_or(200).min(2000) as i64;
  let offset = args.offset.unwrap_or(0) as i64;

  let mut stmt = conn
    .prepare(
      "SELECT id, path, filename, mime_type, taken_at_ms FROM media_items ORDER BY taken_at_ms DESC, filename ASC LIMIT ?1 OFFSET ?2",
    )
    .map_err(|e| format!("prepare query: {e}"))?;

  let rows = stmt
    .query_map(params![limit, offset], |row| {
      Ok(MediaItem {
        id: row.get(0)?,
        path: row.get(1)?,
        filename: row.get(2)?,
        mime_type: row.get(3)?,
        taken_at_ms: row.get(4)?,
      })
    })
    .map_err(|e| format!("query media: {e}"))?;

  let mut out = Vec::new();
  for r in rows {
    out.push(r.map_err(|e| format!("read row: {e}"))?);
  }
  Ok(out)
}
