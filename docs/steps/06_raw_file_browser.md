# 06 — Raw File Browser (Browse + Open in Finder/Explorer)

## Goal
Provide a standard way to browse “raw files” for any imported service/account, regardless of plugin.

## Deliverables
- A raw file browser UI (tree + list).
- File open / reveal-in-folder integration.
- Lightweight previews for common files (images/text) where easy.

## Steps
1) Define the contract
   - Raw files live under `Vault/{pluginId}/{accountId}/raw/`

2) Build the browser UI
   - Folder tree
   - File list
   - Search/filter by filename

3) Add OS integrations
   - “Reveal in Finder/Explorer”
   - “Open with default app” (optional)

## Acceptance Criteria
- From a service detail page, user can open raw browser.
- User can navigate folders and open/reveal files.

