# 05 — Import Wizard Framework (File/Folder Selection + Progress)

## Goal
Implement a reusable “Import Wizard” that works for multiple plugins: show instructions, choose a ZIP/folder, run import, report progress, and write logs.

## Deliverables
- Import wizard UI:
  - instructions
  - file/folder picker
  - progress + log output
  - success summary
- A backend command layer (Tauri commands) for:
  - selecting files/folders
  - copying/extracting into vault
  - writing logs

## Design
- Imports should be **offline-first** (no OAuth in v1).
- Start with “re-import” refresh semantics.

## Steps
1) Wizard UX
   - Step 1: plugin instructions (“Download your data…”) with links
   - Step 2: pick file/folder
   - Step 3: importing…
   - Step 4: done

2) Progress events
   - Create a simple progress event bus:
     - `phase` + `message` + `percent` (optional)

3) Logging
   - Write import log file under `logs/` per run

## Acceptance Criteria
- Wizard runs end-to-end for a dummy importer.
- Import run creates/updates manifest and log.

