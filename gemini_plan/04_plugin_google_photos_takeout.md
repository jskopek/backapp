# Plan: Plugin 2 - Google Photos (via Takeout)

This document outlines the plan for a more complex plugin that imports data from a service that doesn't have a simple "backup" API: Google Photos.

## 1. Summary

- **Service:** Google Photos
- **Goal:** Guide a user to download their photo library using Google Takeout, then import that data into the app for a custom, offline viewing experience.
- **Authentication:** Indirect. We do not need API keys. The user authenticates with Google on their own to perform the Takeout.

## 2. `plugin.json`

```json
{
  "name": "Google Photos",
  "version": "1.0.0",
  "description": "Import and view your library from a Google Takeout export.",
  "author": "Gemini",
  "entrypoints": {
    "frontend": "index.js",
    "backend": "main.js"
  }
}
```

## 3. User Experience (The "Onboarding" Journey)

1.  User selects "Google Photos".
2.  If no data is imported, they are shown a step-by-step guide:
    -   **Step 1:** A button/link that opens `takeout.google.com` in their browser.
    -   **Step 2:** Clear instructions: "Deselect all, then select only **Google Photos**."
    -   **Step 3:** Once the export is complete and downloaded, the user is prompted to select the `.zip` file using a native file dialog.
3.  The app shows a progress bar as it unzips and indexes the files.
4.  Once finished, the view switches to a rich photo gallery.

## 4. Technical Implementation

### Frontend (React)

-   **Onboarding Component:** A multi-step wizard to guide the user through the Takeout process.
-   **File Dialog Trigger:** A button that invokes an IPC call to the main process to show a native file dialog.
-   **Gallery View:** A performant, virtualized grid of image thumbnails. Clicking a thumbnail opens a full-screen viewer with navigation. This component will fetch photo data from the backend in pages.
-   **Full-Screen Viewer:** A modal or separate view to show a single image, its metadata (date, location), and next/previous buttons.

### Backend (Node.js)

The `plugins/google-photos/main.js` file will export the functions for the main process to call.

-   **`start_takeout_import(dataPath, path_to_zip)` function:**
    1.  Receives the path to the user's `.zip` file.
    2.  Uses a Node.js library like `unzipper` to stream-unzip the archive into the plugin's `dataPath`.
    3.  As it unzips, it identifies media files (`.jpg`, `.heic`, etc.) and their associated metadata `.json` files.
    4.  It opens a connection to an **SQLite database** using a library like `better-sqlite3`, creating the file `{dataPath}/photos.db`.
    5.  It prepares an `INSERT` statement and, for each photo, inserts a row into the database containing the file path, capture timestamp (parsed from the JSON), and other relevant metadata. Using a transaction will significantly speed up the import.
-   **`get_photos(dataPath, page, page_size, filter)` function:**
    1.  Queries the `{dataPath}/photos.db` SQLite database.
    2.  Returns a paginated list of photo records to the frontend. This is essential for good performance with large libraries.
-   **`get_photo_details(dataPath, photo_id)` function:** Fetches all metadata for a single photo from the database.
