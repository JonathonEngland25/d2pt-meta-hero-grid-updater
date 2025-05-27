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
- `scheduling-section` (in `index.html`): UI section for scheduling weekly updates. Includes a day-of-week dropdown, time picker, "Schedule Weekly Update" button, "Remove/Modify Schedule" button, and a display for the current schedule status. Handles user input for scheduling and removal of weekly update tasks.
- Scheduling logic (in `index.html` <script>): JavaScript code that listens for scheduling/removal actions, updates the UI state, and communicates with the main process via IPC.
- `ipcMain.handle('schedule-weekly-update', ...)` and `ipcMain.handle('remove-weekly-schedule', ...)` (in `main.js`): IPC handlers that receive scheduling/removal requests from the renderer. Currently simulate scheduling/removal and return success. Will be extended in later phases to integrate with Windows Task Scheduler.
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
- `main.js`: Now includes an IPC handler (`backup-hero-grid`) that checks for an existing hero_grid_config.json in the config folder and renames it to hero_grid_config_backup.json before any update. On first run, it shows a warning dialog (unless in silent mode) and persists a flag in user-settings.json to avoid repeat warnings. This ensures user data safety and clear communication.
- `index.html`: The renderer now calls the backup-hero-grid IPC handler before downloading the new grid. Status messages are shown for backup and download steps, ensuring the user is informed of each operation.
- `user-settings.json`: Now also stores a flag (`backupWarningShown`) to track if the first-run backup warning has been shown, preventing repeated dialogs.

**Phase 11 Flow:**
1. User clicks "Download & Update".
2. Renderer fetches the config path via IPC.
3. Renderer calls `backup-hero-grid` via IPC. If a grid exists, it is backed up and a warning is shown on first run.
4. Only after backup (or if no grid exists), the renderer proceeds to download the new grid.
5. Status messages are shown for each step, improving transparency and UX.

---
