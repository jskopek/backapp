# BackApp

A cross-platform desktop application for managing data backups from multiple services, built with Tauri + React + TypeScript.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v8+)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- Platform-specific dependencies for Tauri: https://tauri.app/start/prerequisites/

## Getting Started

Install dependencies:

```sh
pnpm install
```

Run in development mode:

```sh
pnpm tauri dev
```

Build for production:

```sh
pnpm tauri build
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
