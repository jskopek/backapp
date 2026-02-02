# Plan: Plugin Architecture

This document describes the proposed architecture for the plugin system, which is the core of the application's extensibility.

## 1. Goal

The primary goal is to allow new services to be added to the application without requiring changes to the core application code. Each plugin should be a self-contained unit that the main app can discover and load at runtime.

## 2. Directory Structure

All plugins will reside in a top-level `plugins` directory. The structure is updated to remove Tauri-specific folders and include a Node.js backend entrypoint for each plugin.

```
/backapp
|-- /src              // React Frontend
|-- /electron         // Electron Main Process (Node.js backend)
|-- /plugins
|   |-- /wikipedia
|   |   |-- plugin.json
|   |   |-- icon.svg
|   |   |-- index.js      // Frontend entry point
|   |   `-- main.js       // Backend (Node.js) entry point
|   `-- /google-photos
|       |-- plugin.json
|       |-- icon.svg
|       |-- index.js
|       `-- main.js
```

## 3. The Plugin Manifest (`plugin.json`)

The manifest is updated to include an entrypoint for the backend Node.js code. The "permissions" concept is handled by Electron's main process, not a declarative list.

```json
{
  "name": "Wikipedia",
  "version": "1.0.0",
  "description": "Backup and view Wikipedia articles offline.",
  "author": "Your Name",
  "entrypoints": {
    "frontend": "index.js",
    "backend": "main.js"
  }
}
```

## 4. Frontend-Backend Communication

We will use Electron's standard Inter-Process Communication (IPC) model. The frontend (Renderer Process) sends messages to the backend (Main Process), which then routes them to the correct plugin logic.

**Example:** The Wikipedia plugin's frontend calls its `download_article` function.

**1. Frontend Code (in the plugin's React component):**
A "preload" script will safely expose the `ipcRenderer.invoke` function to the React code.

```javascript
// In the Wikipedia plugin's React component
const result = await window.electron.ipcRenderer.invoke('plugin:command', {
  pluginId: 'wikipedia',
  command: 'download_article',
  args: {
    pageTitle: 'Artificial_intelligence'
  }
});
```

**2. Backend Code (in Electron's main process):**
The main process listens for the `plugin:command` channel and acts as a secure router.

```javascript
// In electron/main.js
const { ipcMain } = require('electron');
const pluginManager = require('./pluginManager'); // A new module to handle logic

ipcMain.handle('plugin:command', async (event, { pluginId, command, args }) => {
  // The pluginManager will find the correct plugin's backend module
  // and call the specified command function.
  return pluginManager.execute(pluginId, command, args);
});
```
This ensures that frontend code can't directly access Node.js APIs and that each plugin's logic remains isolated.

## 5. Data Sandboxing

To ensure security and data integrity, each plugin will have its own dedicated data directory. The core app's Node.js backend will manage these directories and provide the path to the plugin when needed.

- **Location:** Managed by the core app (e.g., using `app.getPath('userData')`).
- **Structure:** `/Users/You/Library/Application Support/BackApp/data/<plugin_id>/`
- **Access:** A plugin's backend code will be given the path to its data directory and can only access that.
