# 03 — Local Vault: Storage Layout + Manifests

## Goal
Define and implement the local “vault” where imported data lives, including a stable folder structure and a manifest file per imported account/backup.

## Deliverables
- A vault directory chosen by the user (or default under app data).
- A per-import folder layout.
- `manifest.json` written/updated on import.

## Proposed Vault Layout
```
Vault/
  google-photos/
    <accountId>/
      manifest.json
      raw/
      index.sqlite
      logs/
  whatsapp/
    <accountId>/
      manifest.json
      raw/
      index.sqlite
      logs/
```

## Manifest Fields (suggested)
- `schemaVersion`
- `pluginId`
- `accountId`
- `displayName`
- `createdAt`
- `lastImportAt`
- `lastImportStatus` (success/failure)
- `importRuns[]` (optional; can be a separate log file later)
- `sourceFingerprints[]` (hashes of selected ZIP/folder)

## Steps
1) Add a “Vault location” setting
   - UI control: choose folder
   - Persist in app settings

2) Implement backend helpers
   - `getVaultPath()`
   - `ensureAccountFolder(pluginId, accountId)`
   - `readManifest()` / `writeManifest()`

3) Wire up UI to show storage paths
   - On Service Detail screen: show where the vault is

## Acceptance Criteria
- User can set vault folder.
- App creates folders and writes `manifest.json` reliably.

