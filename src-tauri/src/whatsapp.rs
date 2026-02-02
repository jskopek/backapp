use crate::vault;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexWhatsappArgs {
  pub account_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexWhatsappResult {
  pub indexed_messages: u64,
  pub indexed_attachments: u64,
  pub chat_file_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThreadSummary {
  pub id: String,
  pub title: String,
  pub message_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageRow {
  pub id: i64,
  pub thread_id: String,
  pub ts_ms: Option<i64>,
  pub sender: String,
  pub body: String,
  pub attachment_filename: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListWhatsappMessagesArgs {
  pub account_id: String,
  pub thread_id: String,
  pub limit: Option<u32>,
  pub offset: Option<u32>,
}

fn ensure_schema(conn: &Connection) -> Result<(), String> {
  conn
    .execute_batch(
      r#"
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS threads (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        thread_id TEXT NOT NULL,
        ts_ms INTEGER,
        sender TEXT NOT NULL,
        body TEXT NOT NULL,
        attachment_filename TEXT,
        FOREIGN KEY(thread_id) REFERENCES threads(id)
      );

      CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, id);
    "#,
    )
    .map_err(|e| format!("create schema: {e}"))?;
  Ok(())
}

fn find_latest_extracted_chat(root: &Path) -> Result<Option<(PathBuf, PathBuf)>, String> {
  // Look for .../raw/import_*/extracted/_chat.txt
  if !root.exists() {
    return Ok(None);
  }
  let mut candidates: Vec<PathBuf> = Vec::new();
  let raw = root.join("raw");
  if !raw.exists() {
    return Ok(None);
  }

  for entry in fs::read_dir(&raw).map_err(|e| format!("read raw dir: {e}"))? {
    let entry = entry.map_err(|e| format!("read raw entry: {e}"))?;
    let p = entry.path();
    if !p.is_dir() {
      continue;
    }
    let extracted = p.join("extracted");
    let chat = extracted.join("_chat.txt");
    if chat.exists() {
      candidates.push(chat);
    }
  }

  candidates.sort_by_key(|p| {
    fs::metadata(p)
      .ok()
      .and_then(|m| m.modified().ok())
      .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
      .map(|d| d.as_millis())
      .unwrap_or(0)
  });

  let chat = match candidates.pop() {
    Some(p) => p,
    None => return Ok(None),
  };
  let extracted_dir = chat
    .parent()
    .ok_or_else(|| "Invalid chat path".to_string())?
    .to_path_buf();
  Ok(Some((chat, extracted_dir)))
}

fn parse_line_v1(line: &str) -> Option<(Option<i64>, String, String, Option<String>)> {
  // Very small v1 parser for common iOS export format:
  // "[12/31/23, 9:41:00 PM] Name: message"
  // Attachments often appear as: "<attached: IMG-20240101-WA0001.jpg>"

  if !line.starts_with('[') {
    return None;
  }
  let close = line.find("] ")?;
  let bracket = &line[1..close];
  let rest = &line[(close + 2)..];

  let colon = rest.find(": ")?;
  let sender = rest[..colon].trim().to_string();
  let body = rest[(colon + 2)..].trim().to_string();

  let attachment = if body.starts_with("<attached:") && body.ends_with('>') {
    let inner = body.trim_start_matches("<attached:").trim_end_matches('>');
    Some(inner.trim().to_string())
  } else {
    None
  };

  // We avoid strict timestamp parsing for v1; store null.
  // (Step 08 notes locale/date variants; we can improve later.)
  let _ts_raw = bracket;
  Some((None, sender, body, attachment))
}

#[tauri::command]
pub fn index_whatsapp_ios(
  app: AppHandle,
  args: IndexWhatsappArgs,
) -> Result<IndexWhatsappResult, String> {
  let vault_path = vault::resolve_vault_path_for_import(&app)?;
  let account_root = vault_path.join("whatsapp").join(&args.account_id);
  let sqlite_path = account_root.join("index.sqlite");

  let (chat_path, extracted_dir) = find_latest_extracted_chat(&account_root)?
    .ok_or_else(|| "Could not find extracted _chat.txt; re-import and ensure ZIP extraction ran".to_string())?;

  let raw = fs::read_to_string(&chat_path).map_err(|e| format!("read _chat.txt: {e}"))?;

  let mut conn = Connection::open(sqlite_path).map_err(|e| format!("open sqlite: {e}"))?;
  ensure_schema(&conn)?;

  conn
    .execute("DELETE FROM messages", [])
    .map_err(|e| format!("clear messages: {e}"))?;
  conn
    .execute("DELETE FROM threads", [])
    .map_err(|e| format!("clear threads: {e}"))?;

  let thread_id = "default".to_string();
  let title = chat_path
    .file_name()
    .map(|s| s.to_string_lossy().to_string())
    .unwrap_or_else(|| "WhatsApp Chat".to_string());

  conn
    .execute(
      "INSERT INTO threads (id, title) VALUES (?1, ?2)",
      params![thread_id, title],
    )
    .map_err(|e| format!("insert thread: {e}"))?;

  let tx = conn
    .transaction()
    .map_err(|e| format!("begin tx: {e}"))?;

  let mut msg_count: u64 = 0;
  let mut att_count: u64 = 0;

  for line in raw.lines() {
    if let Some((ts_ms, sender, body, attachment)) = parse_line_v1(line) {
      let attachment_present = attachment.is_some();

      // If attachment exists, verify file presence (best-effort) and keep only filename.
      let attachment_filename = attachment.and_then(|name| {
        let candidate = extracted_dir.join(&name);
        if candidate.exists() {
          Some(name)
        } else {
          // Some exports include different naming; still store it.
          Some(name)
        }
      });

      tx.execute(
        "INSERT INTO messages (thread_id, ts_ms, sender, body, attachment_filename) VALUES (?1, ?2, ?3, ?4, ?5)",
        params!["default", ts_ms, sender, body, attachment_filename],
      )
      .map_err(|e| format!("insert message: {e}"))?;
      msg_count += 1;
      if attachment_present {
        att_count += 1;
      }
    }
  }

  tx.commit().map_err(|e| format!("commit tx: {e}"))?;

  Ok(IndexWhatsappResult {
    indexed_messages: msg_count,
    indexed_attachments: att_count,
    chat_file_path: chat_path.to_string_lossy().to_string(),
  })
}

#[tauri::command]
pub fn list_whatsapp_threads(app: AppHandle, account_id: String) -> Result<Vec<ThreadSummary>, String> {
  let vault_path = vault::resolve_vault_path_for_import(&app)?;
  let account_root = vault_path.join("whatsapp").join(&account_id);
  let sqlite_path = account_root.join("index.sqlite");
  let conn = Connection::open(sqlite_path).map_err(|e| format!("open sqlite: {e}"))?;
  ensure_schema(&conn)?;

  let mut stmt = conn
    .prepare(
      "SELECT t.id, t.title, (SELECT COUNT(1) FROM messages m WHERE m.thread_id = t.id) AS message_count FROM threads t ORDER BY t.id",
    )
    .map_err(|e| format!("prepare: {e}"))?;

  let rows = stmt
    .query_map([], |row| {
      Ok(ThreadSummary {
        id: row.get(0)?,
        title: row.get(1)?,
        message_count: row.get::<_, i64>(2)? as u64,
      })
    })
    .map_err(|e| format!("query: {e}"))?;

  let mut out = Vec::new();
  for r in rows {
    out.push(r.map_err(|e| format!("row: {e}"))?);
  }
  Ok(out)
}

#[tauri::command]
pub fn list_whatsapp_messages(
  app: AppHandle,
  args: ListWhatsappMessagesArgs,
) -> Result<Vec<MessageRow>, String> {
  let vault_path = vault::resolve_vault_path_for_import(&app)?;
  let account_root = vault_path.join("whatsapp").join(&args.account_id);
  let sqlite_path = account_root.join("index.sqlite");
  let conn = Connection::open(sqlite_path).map_err(|e| format!("open sqlite: {e}"))?;
  ensure_schema(&conn)?;

  let limit = args.limit.unwrap_or(500).min(5000) as i64;
  let offset = args.offset.unwrap_or(0) as i64;

  let mut stmt = conn
    .prepare(
      "SELECT id, thread_id, ts_ms, sender, body, attachment_filename FROM messages WHERE thread_id = ?1 ORDER BY id ASC LIMIT ?2 OFFSET ?3",
    )
    .map_err(|e| format!("prepare: {e}"))?;

  let rows = stmt
    .query_map(params![args.thread_id, limit, offset], |row| {
      Ok(MessageRow {
        id: row.get(0)?,
        thread_id: row.get(1)?,
        ts_ms: row.get(2)?,
        sender: row.get(3)?,
        body: row.get(4)?,
        attachment_filename: row.get(5)?,
      })
    })
    .map_err(|e| format!("query: {e}"))?;

  let mut out = Vec::new();
  for r in rows {
    out.push(r.map_err(|e| format!("row: {e}"))?);
  }
  Ok(out)
}

