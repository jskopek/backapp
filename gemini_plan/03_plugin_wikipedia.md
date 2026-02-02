# Plan: Plugin 1 - Wikipedia Downloader

This document outlines the plan for the first, simple plugin: a tool to download and read Wikipedia articles offline.

## 1. Summary

- **Service:** Wikipedia
- **Goal:** Allow a user to enter a Wikipedia article title (or URL), download it, and view it within the app without an internet connection.
- **Authentication:** None required. This plugin will use public APIs.

## 2. `plugin.json`

```json
{
  "name": "Wikipedia",
  "version": "1.0.0",
  "description": "Backup and view Wikipedia articles offline.",
  "author": "Gemini",
  "entrypoints": {
    "frontend": "index.js",
    "backend": "main.js"
  }
}
```

## 3. User Experience

1.  The user selects "Wikipedia" from the plugin list in the sidebar.
2.  The main view shows a list of previously downloaded articles and a prominent text input field labeled "Enter Wikipedia Article Title or URL".
3.  The user types a title (e.g., "Alan Turing") and clicks "Download".
4.  A progress indicator appears. Once complete, "Alan Turing" is added to the list of downloaded articles.
5.  Clicking the "Alan Turing" list item opens a view that renders the saved article content.

## 4. Technical Implementation

### Frontend (React)

-   A main component for the plugin.
-   State management for the list of articles and the input field.
-   A view to render the article content. This can be done safely inside an `<iframe>` or by using a library to sanitize the HTML before rendering it directly.
-   Functions that call the backend via the `window.electron.ipcRenderer.invoke('plugin:command', ...)` method to trigger downloads and fetch the list of saved articles.

### Backend (Node.js)

The `plugins/wikipedia/main.js` file will export an object containing functions that the main process can call. The plugin will be passed its dedicated data path.

-   **`list_articles(dataPath)` function:**
    1.  Uses Node's `fs.promises.readdir()` to scan the `dataPath` for saved `.html` files.
    2.  Returns an array of their titles.
-   **`get_article(dataPath, title)` function:**
    1.  Uses Node's `fs.promises.readFile()` to read the content of `{dataPath}/{title}.html`.
    2.  Returns the content as a string.
-   **`download_article(dataPath, title)` function:**
    1.  Uses a Node.js HTTP client like `axios`.
    2.  Constructs the URL for the Wikipedia REST API (e.g., `https://en.wikipedia.org/api/rest_v1/page/html/{title}`).
    3.  Fetches the HTML content.
    4.  Uses `fs.promises.writeFile()` to save the content to a file named `{dataPath}/{title}.html`.
