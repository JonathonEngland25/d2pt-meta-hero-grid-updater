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

---
