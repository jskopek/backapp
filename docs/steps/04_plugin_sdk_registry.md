# 04 — Plugin SDK + Built-in Registry

## Goal
Create a plugin interface that supports “import + index + viewer”, and register built-in plugins (Google Photos Takeout, WhatsApp iOS export).

## Deliverables
- A TypeScript plugin interface (the contract).
- A built-in plugin registry.
- A per-plugin page that can render its custom viewer component.

## Plugin Contract (MVP shape)
Each plugin should provide:
- `metadata`: id, name, description, icon
- `instructions`: React component or Markdown content
- `importer`: function invoked by the import wizard
- `viewer`: React routes/components for designed view
- `rawBrowserHints` (optional): labels/filters for raw files

## Steps
1) Create `packages/plugin-sdk` (or `src/plugins/sdk`)
   - Export types and helper utilities

2) Create `plugins/` folder for built-ins
   - `plugins/google-photos-takeout`
   - `plugins/whatsapp-ios-export`

3) Register plugins in a single place
   - `getBuiltInPlugins(): Plugin[]`

## Acceptance Criteria
- Services list is derived from plugin registry.
- Clicking a service uses plugin metadata.

