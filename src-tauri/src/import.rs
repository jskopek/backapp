use crate::vault::{self, Manifest};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportProgress {
  pub phase: String,
  pub message: String,
  pub percent: Option<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunImportArgs {
  pub plugin_id: String,
  pub account_id: String,
  pub display_name: Option<String>,
  pub source_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunImportResult {
  pub run_id: String,
  pub log_path: String,
  pub account_root: String,
}

fn now_iso() -> String {
  // Simple ISO-ish string without extra dependencies.
  let millis = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default()
    .as_millis();
  format!("{millis}")
}

fn emit_progress(app: &AppHandle, payload: &ImportProgress) {
  let _ = app.emit_all("import://progress", payload);
}

fn write_log_line(log_path: &Path, line: &str) -> Result<(), String> {
  use std::io::Write;
  let mut file = fs::OpenOptions::new()
    .create(true)
    .append(true)
    .open(log_path)
    .map_err(|e| format!("open log: {e}"))?;
  writeln!(file, "{line}").map_err(|e| format!("write log: {e}"))
}

fn list_files_recursive(root: &Path) -> Result<Vec<PathBuf>, String> {
  let mut out = Vec::new();
  if root.is_file() {
    out.push(root.to_path_buf());
    return Ok(out);
  }
  if !root.is_dir() {
    return Err("source path is not a file or directory".to_string());
  }

  let mut stack = vec![root.to_path_buf()];
  while let Some(dir) = stack.pop() {
    let entries = fs::read_dir(&dir).map_err(|e| format!("read dir: {e}"))?;
    for entry in entries {
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

fn copy_file(src: &Path, dst: &Path) -> Result<(), String> {
  if let Some(parent) = dst.parent() {
    if !parent.exists() {
      fs::create_dir_all(parent).map_err(|e| format!("create dir: {e}"))?;
    }
  }
  fs::copy(src, dst).map_err(|e| format!("copy file: {e}"))?;
  Ok(())
}

fn sanitize_zip_path(name: &str) -> Option<PathBuf> {
  let path = Path::new(name);
  let mut out = PathBuf::new();
  for component in path.components() {
    match component {
      std::path::Component::Normal(part) => out.push(part),
      // Reject absolute paths, prefixes, and any .. components.
      _ => return None,
    }
  }
  if out.as_os_str().is_empty() {
    None
  } else {
    Some(out)
  }
}

fn extract_zip(
  app: &AppHandle,
  zip_path: &Path,
  dest_dir: &Path,
  log_path: &Path,
) -> Result<(), String> {
  let file = fs::File::open(zip_path).map_err(|e| format!("open zip: {e}"))?;
  let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("read zip: {e}"))?;

  write_log_line(
    log_path,
    &format!("extract zip: {} ({} entries)", zip_path.display(), archive.len()),
  )?;

  if !dest_dir.exists() {
    fs::create_dir_all(dest_dir).map_err(|e| format!("create extract dir: {e}"))?;
  }

  let total = archive.len().max(1);
  for i in 0..archive.len() {
    let mut entry = archive
      .by_index(i)
      .map_err(|e| format!("read zip entry: {e}"))?;

    let name = entry.name().to_string();
    let rel = sanitize_zip_path(&name)
      .ok_or_else(|| format!("unsafe zip entry path: {name}"))?;
    let out_path = dest_dir.join(&rel);

    let percent = (((i + 1) as f64 / total as f64) * 60.0) as u8 + 35;
    emit_progress(
      app,
      &ImportProgress {
        phase: "extract".to_string(),
        message: format!("Extracting {}", rel.display()),
        percent: Some(percent.min(98)),
      },
    );

    if entry.is_dir() {
      fs::create_dir_all(&out_path).map_err(|e| format!("create dir: {e}"))?;
      continue;
    }

    if let Some(parent) = out_path.parent() {
      fs::create_dir_all(parent).map_err(|e| format!("create dir: {e}"))?;
    }

    let mut out_file = fs::File::create(&out_path).map_err(|e| format!("create file: {e}"))?;
    io::copy(&mut entry, &mut out_file).map_err(|e| format!("write file: {e}"))?;
  }

  Ok(())
}

fn find_zip_files(root: &Path) -> Result<Vec<PathBuf>, String> {
  let files = list_files_recursive(root)?;
  Ok(
    files
      .into_iter()
      .filter(|p| {
        p.extension()
          .and_then(|e| e.to_str())
          .map(|e| e.eq_ignore_ascii_case("zip"))
          .unwrap_or(false)
      })
      .collect(),
  )
}

fn copy_source_into_raw(
  app: &AppHandle,
  source: &Path,
  raw_dir: &Path,
  run_id: &str,
  log_path: &Path,
) -> Result<PathBuf, String> {
  let import_root = raw_dir.join(format!("import_{run_id}"));
  fs::create_dir_all(&import_root).map_err(|e| format!("create import dir: {e}"))?;

  if source.is_file() {
    let file_name = source
      .file_name()
      .ok_or_else(|| "source file has no filename".to_string())?;
    let dest = import_root.join(file_name);
    emit_progress(
      app,
      &ImportProgress {
        phase: "copy".to_string(),
        message: "Copying file".to_string(),
        percent: Some(10),
      },
    );
    write_log_line(log_path, &format!("copy file: {}", source.display()))?;
    copy_file(source, &dest)?;
    emit_progress(
      app,
      &ImportProgress {
        phase: "copy".to_string(),
        message: "Copied file".to_string(),
        percent: Some(30),
      },
    );

    // If the source is a .zip, extract it for immediate usability.
    let is_zip = dest
      .extension()
      .and_then(|e| e.to_str())
      .map(|e| e.eq_ignore_ascii_case("zip"))
      .unwrap_or(false);
    if is_zip {
      let extracted = import_root.join("extracted");
      extract_zip(app, &dest, &extracted, log_path)?;
      write_log_line(log_path, &format!("extracted to: {}", extracted.display()))?;
      emit_progress(
        app,
        &ImportProgress {
          phase: "extract".to_string(),
          message: "Extraction complete".to_string(),
          percent: Some(98),
        },
      );
    }

    return Ok(import_root);
  }

  let files = list_files_recursive(source)?;
  let total = files.len().max(1);
  write_log_line(
    log_path,
    &format!("copy directory: {} ({} files)", source.display(), total),
  )?;

  for (i, file) in files.iter().enumerate() {
    let rel = file
      .strip_prefix(source)
      .map_err(|_| "failed to compute relative path".to_string())?;
    let dest = import_root.join(rel);
    let percent = (((i + 1) as f64 / total as f64) * 80.0) as u8 + 10;
    emit_progress(
      app,
      &ImportProgress {
        phase: "copy".to_string(),
        message: format!("Copying {}", rel.display()),
        percent: Some(percent.min(95)),
      },
    );
    copy_file(file, &dest)?;
  }

  // If the selected source is a folder that contains zip files (common for
  // multi-part Takeout exports), extract them into a sibling folder.
  let copied_zips = find_zip_files(&import_root)?;
  if !copied_zips.is_empty() {
    let extracted_root = import_root.join("extracted");
    fs::create_dir_all(&extracted_root)
      .map_err(|e| format!("create extracted dir: {e}"))?;

    // Safety: cap extraction to avoid runaway work.
    let max_extract = 25usize;
    for (i, zip_file) in copied_zips.iter().take(max_extract).enumerate() {
      let base = zip_file
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("zip");
      let dest = extracted_root.join(base);
      emit_progress(
        app,
        &ImportProgress {
          phase: "extract".to_string(),
          message: format!("Extracting ZIP {}/{}", i + 1, copied_zips.len()),
          percent: Some(96),
        },
      );
      extract_zip(app, zip_file, &dest, log_path)?;
    }
    write_log_line(
      log_path,
      &format!(
        "extracted {} zip(s) under: {}",
        copied_zips.len().min(max_extract),
        extracted_root.display()
      ),
    )?;
  }

  emit_progress(
    app,
    &ImportProgress {
      phase: "copy".to_string(),
      message: "Copy complete".to_string(),
      percent: Some(95),
    },
  );

  Ok(import_root)
}

#[tauri::command]
pub fn run_import(app: AppHandle, args: RunImportArgs) -> Result<RunImportResult, String> {
  let vault_path = vault::resolve_vault_path_for_import(&app)?;
  let account_root = vault_path.join(&args.plugin_id).join(&args.account_id);

  // Ensure folders exist.
  fs::create_dir_all(account_root.join("raw")).map_err(|e| format!("create raw: {e}"))?;
  fs::create_dir_all(account_root.join("logs")).map_err(|e| format!("create logs: {e}"))?;

  let run_id = now_iso();
  let log_path = account_root
    .join("logs")
    .join(format!("import_{run_id}.log"));

  emit_progress(
    &app,
    &ImportProgress {
      phase: "start".to_string(),
      message: "Starting import".to_string(),
      percent: Some(0),
    },
  );

  write_log_line(
    &log_path,
    &format!(
      "start import pluginId={} accountId={} sourcePath={}",
      args.plugin_id, args.account_id, args.source_path
    ),
  )?;

  let source = PathBuf::from(&args.source_path);
  if !source.exists() {
    write_log_line(&log_path, "ERROR: source path does not exist")?;
    return Err("Source path does not exist".to_string());
  }

  let import_root = copy_source_into_raw(&app, &source, &account_root.join("raw"), &run_id, &log_path)?;
  write_log_line(&log_path, &format!("raw stored at: {}", import_root.display()))?;

  // Manifest update
  let created_at = now_iso();
  let existing = vault::read_manifest_inner(&vault_path, &args.plugin_id, &args.account_id)?;
  let mut manifest: Manifest = existing.unwrap_or(Manifest {
    schema_version: 1,
    plugin_id: args.plugin_id.clone(),
    account_id: args.account_id.clone(),
    display_name: args.display_name.clone(),
    created_at,
    last_import_at: None,
    last_import_status: None,
    source_fingerprints: Vec::new(),
  });

  manifest.display_name = args.display_name.clone().or(manifest.display_name);
  manifest.last_import_at = Some(run_id.clone());
  manifest.last_import_status = Some("success".to_string());
  manifest
    .source_fingerprints
    .push(format!("path:{}", args.source_path));

  vault::write_manifest_inner(&vault_path, &manifest)?;
  write_log_line(&log_path, "manifest updated")?;

  emit_progress(
    &app,
    &ImportProgress {
      phase: "done".to_string(),
      message: "Import complete".to_string(),
      percent: Some(100),
    },
  );

  Ok(RunImportResult {
    run_id,
    log_path: log_path.to_string_lossy().to_string(),
    account_root: account_root.to_string_lossy().to_string(),
  })
}
