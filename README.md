# BackApp

Local-first backups of your data from other services.

This repo currently contains a minimal **Tauri + React (Vite + TypeScript)** “Hello BackApp” app, as described in `docs/steps/01_hello_world_tauri.md`.

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm (comes with Node) or pnpm
- Rust toolchain (stable)
  - Install via `rustup` and ensure `cargo` is on your PATH

Platform notes:

- macOS: Xcode Command Line Tools (`xcode-select --install`)
- Windows: Microsoft C++ Build Tools + WebView2 runtime

## Development

Install dependencies:

```sh
npm install
```

Run the desktop app:

```sh
npm run tauri dev
```

## Build

```sh
npm run tauri build
```

Note: bundling is currently disabled (`src-tauri/tauri.conf.json` has `bundle.active=false`) to keep the initial scaffold lightweight.
