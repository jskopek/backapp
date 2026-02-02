# 01 — Hello World (Tauri + React) + Dev Environment

## Goal
Get a minimal cross-platform desktop app running with **Tauri + React**, with a repeatable dev environment and a “Hello BackApp” screen.

## Deliverables
- A working Tauri app that runs on macOS and Windows.
- A React UI that renders a single page.
- Basic repo structure and scripts.

## Implementation Notes
- Recommended stack:
  - Tauri v2 (or v1 if you prefer stability right now)
  - React + TypeScript
  - Vite

## Steps
1) Scaffold the app
   - `pnpm create tauri-app` (or `npm create tauri-app`)
   - Choose: `React` + `TypeScript` + `Vite`

2) Run in dev
   - `pnpm install`
   - `pnpm tauri dev`

3) Create the minimal UI
   - Replace the default template with a single page:
     - App name
     - “Services” placeholder list (static)
     - App version (optional)

4) Add basic repo hygiene
   - Add a `.gitignore` suitable for Node + Tauri
   - Add `README.md` with:
     - prerequisites
     - `pnpm install`
     - `pnpm tauri dev`
     - `pnpm tauri build`

## Acceptance Criteria
- `pnpm tauri dev` opens a native window.
- The UI displays “Hello BackApp” (or similar).
- Builds run locally: `pnpm tauri build`.

## Stretch (optional)
- Add a simple top-level navigation skeleton: “Services”, “Settings”.

