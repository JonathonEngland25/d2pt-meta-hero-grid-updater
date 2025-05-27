# Architecture Notes

## Files and Their Purpose

- `package.json`: Project manifest. Defines dependencies, scripts, and metadata for the Node.js/Electron app.
- `main.js`: Electron main process. Responsible for creating the application window and loading the UI. No direct UI logic; delegates all UI to index.html.
- `index.html`: Main UI for the app. Now includes radio buttons for grid selection ("Most Played", "High Win Rate", "D2PT Rating") and JavaScript to update the selected grid display live. Handles all user interaction for grid selection.
- `Download & Update` button (in `index.html`): UI button below grid selection. Triggers a click event to start the download/update process (currently logs to console for test purposes).
- Button click event handler (in `index.html` <script>): Handles the button click and logs a message to the console. Will later be extended to trigger the actual download/update logic.
- `status-area` (in `index.html`): UI area below the Download & Update button. Displays notifications and operation results to the user. Updated via JavaScript using the `showStatus` function.
- `showStatus` function (in `index.html` <script>): Handles displaying messages in the status area, including color and auto-clear logic. Used for user feedback on operations.
- `steamid-config-section` (in `index.html`): UI section below the status area. Displays the user's SteamID and Dota 2 config folder path. Initially uses test values, to be replaced by real detection logic in later steps.
- `steamid-value` and `config-path-value` (in `index.html`): `<span>` elements within the new section that show the SteamID and config path. Their content is set via JavaScript.
- Test value assignment (in `index.html` <script>): JavaScript code that sets the content of the above spans to test values for Step 5. This will later be replaced with actual detection logic.
- `Select Config Folder` button (in `index.html`): UI button below the config path display. Allows the user to manually select the Dota 2 config folder if automatic detection is incorrect or fails.
- Button click event handler (in `index.html` <script>): Uses Electron's `ipcRenderer` to invoke the 'select-config-folder' IPC channel, requesting the main process to open a folder selection dialog. Updates the config path display and shows a status message when a folder is selected.
- `ipcMain.handle('select-config-folder', ...)` (in `main.js`): Handles the IPC request from the renderer. Opens a native folder selection dialog using Electron's `dialog` module and returns the selected folder path to the renderer process.
- `puppeteer` (Node.js dependency): Used in the main process to launch a headless browser for scraping JavaScript-rendered content from dota2protracker.com/meta-hero-grids. Ensures download links are reliably found even if rendered client-side.
- `download-grid-json` (IPC handler in `main.js`): Handles requests from the renderer to fetch the latest grid JSON for the selected type. Uses Puppeteer to scrape the page, finds the correct download link by matching the mode query parameter, downloads the JSON, and returns it to the renderer.
- Status message logic (in `index.html`): The `showStatus` function now displays persistent success/failure messages in the status area, improving user feedback and testability.

**File Purposes (Phase 8 additions):**
- `main.js`: Contains the Electron main process, IPC handlers, and Puppeteer-based scraping logic for grid downloads.
- `index.html`: Main UI, including grid selection, download button, and persistent status area for user feedback.
- `package.json`: Now includes Puppeteer as a dependency for headless browser automation.

**File Purposes (Phase 9 additions):**
- `user-settings.json`: Stores user preferences, including the selected SteamID, in Electron's user data directory (`AppData/Roaming/d2pt-meta-hero-grid-updater/`).
- `main.js`: Now includes logic to scan for SteamIDs, prompt the user if multiple are found, persist the selection, and allow flushing settings via a command-line argument (`--flush`).
- `index.html`: UI now includes a "Change SteamID" button to let the user re-select their SteamID at any time. The UI updates to reflect the current SteamID and config path.
- **Settings Reset:** Running the app with `--flush` deletes `user-settings.json`, resetting all persisted user settings and requiring the user to select a SteamID again on next launch.

**File Purposes (Phase 10 additions):**
- `user-settings.json`: Now also stores the manually selected config path as `manualConfigPath`. If set, this path is used for all config operations and displayed in the UI with a '(manual)' indicator.
- `main.js`: When the user selects a config folder, the path is persisted in `user-settings.json`. On app launch, if `manualConfigPath` is set, it is returned by the `get-steamid-and-config-path` IPC handler and used in place of the SteamID-based path. An IPC handler to clear the manual path is also present for future UX improvements.
- `index.html`: When the user selects a config folder, the UI updates and the path is persisted. On launch, the UI displays the manual path if set, or the auto-detected path otherwise. The config path display shows '(manual)' if the manual path is active.

**File Purposes (Phase 11 additions):**
- `main.js`: Now includes an IPC handler (`backup-hero-grid`) that checks for an existing hero_grid_config.json in the config folder and renames it to hero_grid_config_backup.json before any update. On first run, it shows a warning dialog and persists a flag in user-settings.json to avoid repeat warnings. This ensures user data safety and clear communication.
- `index.html`: The renderer now calls the backup-hero-grid IPC handler before downloading the new grid. Status messages are shown for backup and download steps, ensuring the user is informed of each operation.
- `user-settings.json`: Now also stores a flag (`backupWarningShown`) to track if the first-run backup warning has been shown, preventing repeated dialogs.

**Phase 11 Flow:**
1. User clicks "Download & Update".
2. Renderer fetches the config path via IPC.
3. Renderer calls `backup-hero-grid` via IPC. If a grid exists, it is backed up and a warning is shown on first run.
4. Only after backup (or if no grid exists), the renderer proceeds to download the new grid.
5. Status messages are shown for each step, improving transparency and UX.

**File Purposes (Phase 12 additions):**
- `main.js`: Now includes an IPC handler (`replace-hero-grid`) that saves the downloaded grid JSON as `hero_grid_config.json` in the config folder. This handler takes the config path and JSON data, writes the file, and returns success or error.
- `index.html`: The renderer now calls `replace-hero-grid` after a successful download, passing the config path and JSON. The UI displays a status message for success or failure of the update step.

**Phase 12 Flow:**
1. After backup and download, the renderer calls `replace-hero-grid` via IPC, passing the config path and downloaded JSON.
2. The main process writes the JSON to `hero_grid_config.json` in the config folder.
3. The renderer displays a success or error message in the status area, informing the user of the result.

**File Purposes (Phase 13 additions):**
- `main.js`: Now includes logic to send Windows notifications using Electron's Notification API for download, backup, and replace steps. A helper (`maybeNotify`) checks if notifications are enabled in user-settings.json and shows them if so. IPC handlers allow the renderer to get/set this setting.
- `index.html`: Adds a checkbox to the UI to enable/disable Windows notifications. The checkbox state is loaded from the main process on startup and persisted via IPC. When enabled, users receive native Windows notifications for relevant events in addition to status area messages.
- `user-settings.json`: Now includes an `enableWindowsNotifications` boolean flag to persist the user's preference for Windows notifications.

**Phase 13 Flow:**
1. User toggles the "Enable Windows notifications" checkbox in the UI.
2. The renderer calls an IPC handler to update the setting in user-settings.json.
3. On download, backup, or replace events, the main process checks the setting and shows a Windows notification if enabled.
4. Status area notifications in the UI are always shown, regardless of the Windows notification setting.

**File Purposes (Phase 14 additions):**
- `main.js`: The `get-steamid-and-config-path` IPC handler now checks if the detected config path (via SteamID or manual override) actually exists. If not, it returns an error and does not return a config path. This ensures the app never operates on a missing or invalid directory.
- `index.html`: The renderer listens for errors from `get-steamid-and-config-path`. If the config path is missing or invalid, the UI automatically opens the folder selection dialog, prompting the user to select a valid config folder. This prevents the user from proceeding without a valid path and streamlines recovery from missing/renamed directories.
- `user-settings.json`: Continues to persist the manual config path if set. If the manual path is missing, the app prompts the user to select a new one at startup.

**Phase 14 Flow:**
1. On startup, the app checks for a valid config path (manual or auto-detected).
2. If the path is missing or invalid, the user is immediately prompted to select a folder.
3. The selected path is persisted and used for all future operations.
4. This ensures robust handling of missing/renamed Steam or config directories and a seamless user experience.

---
