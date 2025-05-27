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

---
