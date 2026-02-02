# 07 — Plugin: Google Photos (Takeout Import + Gallery Viewer)

## Goal
Support importing **Google Takeout** exports for Google Photos, storing raw files, indexing key metadata, and offering a simple gallery/timeline viewer.

## Input Format (v1)
- User downloads Google Takeout for Google Photos.
- Input is typically:
  - One or more ZIP files containing photos/videos and JSON sidecars.

## Deliverables
- Importer that:
  - accepts one or multiple ZIPs
  - extracts/copies into `raw/`
  - indexes media records into `index.sqlite`
- Viewer that:
  - shows a grid/timeline of media
  - basic filters: date range (optional)
  - click-to-view full item

## SQLite Schema (suggested)
- `media_items`
  - `id` (stable hash)
  - `path`
  - `filename`
  - `mime_type`
  - `created_at`
  - `taken_at` (if available)
  - `width`, `height`, `duration_ms` (optional)
- `albums` / `album_items` (optional for v1)

## Steps
1) Implement ZIP import
   - Extract into a deterministic folder structure
   - Handle duplicates (hash-based)

2) Index media
   - Walk extracted files
   - Parse sidecar JSON when present
   - Fallback to filesystem timestamps

3) Build the gallery
   - Virtualized grid (performance)
   - Simple “details” view

## Acceptance Criteria
- User can import a Takeout ZIP.
- Viewer shows imported images/videos.
- Raw files are accessible from raw browser.

## Notes / Known Constraints (OK for v1)
- Albums/people/places can be deferred.
- “Refresh” can be re-import of new ZIPs.

