# Progress Log

## Step 1: Project Setup (Completed)
- Initialized a new Node.js project with `npm init -y`.
- Installed Electron as a dev dependency (`npm install --save-dev electron`).
- Created `main.js` as the Electron main process file to open a window.
- Added a minimal placeholder UI in `index.html`.
- Added a `start` script to `package.json` to launch the app with Electron.

**How to test:**
- Run `npm start` in the project directory.
- Verify that a window opens displaying the app name and a placeholder message.

## Step 2: UI Grid Selection (Completed)
- Added three radio buttons to the UI for grid selection: "Most Played", "High Win Rate", and "D2PT Rating".
- Added a display area below the radio buttons to show the currently selected grid.
- Implemented minimal JavaScript to update the display live as the user changes their selection.

**How to test:**
- Run `npm start` in the project directory.
- Verify that the app window shows the three grid options.
- Select each option and confirm the "Selected" display updates accordingly.

## Step 3: UI Download & Update Button (Completed)
- Added a "Download & Update" button below the grid selection in the UI.
- Implemented a click event handler for the button that logs a message to the console when clicked.
- Updated the placeholder text to indicate Step 3 progress.

**How to test:**
- Run `npm start` in the project directory.
- Verify that the app window shows the "Download & Update" button below the grid selection.
- Click the button and confirm that a message is logged to the console (open Developer Tools with Ctrl+Shift+I to view the console).

## Step 4: UI Status Area (Completed)
- Added a status area below the "Download & Update" button in the UI (`index.html`).
- Implemented a function to display notifications and operation results in the status area.
- When the button is clicked, a test notification appears in the status area and disappears after a few seconds.

**How to test:**
- Run `npm start` in the project directory.
- Click the "Download & Update" button.
- Verify that a green notification appears in the status area and then disappears after a few seconds.

## Step 5: UI SteamID & Config Path Display (Completed)
- Added a new section below the status area in `index.html` to display the detected SteamID and config folder path.
- For this step, test values are hardcoded in the UI and set via JavaScript for demonstration purposes.
- The section includes two lines: one for SteamID and one for the config path, both using placeholder values.
- This prepares the UI for future integration with real detection logic in later steps.

**How to test:**
- Run `npm start` in the project directory.
- Verify that the app window shows a SteamID and config path below the status area.
- Confirm that the displayed values match the test values set in the script.

## Step 6: UI Manual Config Path Selection (Completed)
- Added a "Select Config Folder" button below the config path display in the UI (`index.html`).
- When clicked, the button opens a native folder selection dialog using Electron's dialog module (handled in `main.js`).
- When a folder is selected, the config path display in the UI updates to show the new path, and a status message is shown.
- Communication between the renderer and main process is handled via Electron's IPC (`ipcRenderer` and `ipcMain`).

**How to test:**
- Run `npm start` in the project directory.
- Click the "Select Config Folder" button below the config path.
- Select a folder in the dialog and confirm the config path display updates to the selected folder.
- A green status message should appear confirming the update.

## Step 7: UI Scheduling Section (Completed)
- Added a new section to the UI for scheduling weekly updates, including:
  - Day-of-week dropdown
  - Time picker
  - "Schedule Weekly Update" button
  - "Remove/Modify Schedule" button
  - Display of current schedule status
- Implemented renderer logic to handle scheduling/removal actions and update UI state.
- Added IPC communication to main process for scheduling/removal (simulated for now).

**How to test:**
- Run `npm start` in the project directory.
- In the app, set a day and time, then click "Schedule Weekly Update".
  - The status should update to show the scheduled day/time.
  - A notification should appear.
  - The console should log the simulated scheduling.
- Click "Remove/Modify Schedule".
  - The status should reset to "No schedule set."
  - A notification should appear.
  - The console should log the simulated removal.

## Step 8: Download Grid Logic (Completed)
- Implemented dynamic scraping of https://dota2protracker.com/meta-hero-grids using Puppeteer to handle JavaScript-rendered content.
- The app now finds the correct download link for each grid type (Most Played, High Win Rate, D2PT Rating) by parsing the mode query parameter.
- Downloads the selected grid's JSON and returns it to the renderer process.
- UI now displays persistent success/failure messages in the status area.

**How to test:**
- Run `npm start` in the project directory.
- Select a grid type and click "Download & Update".
- Confirm that a success message and a snippet of the downloaded JSON appear in the status area.
- Try all grid types to ensure each downloads correctly.
- Confirm that error messages persist if a failure occurs.

## Step 9: SteamID Detection, Selection, and Persistence (Completed)
- Implemented logic to scan the Steam userdata directory for SteamIDs.
- If only one SteamID is found, it is used automatically.
- If multiple SteamIDs are found, the user is prompted to select one via a dialog.
- The selected SteamID is persisted in a user settings file for future runs.
- Added a "Change SteamID" button in the UI to allow the user to re-select their SteamID at any time.
- Added a command-line argument `--flush` to delete all user settings (including the persisted SteamID) before the app starts.

**How to test:**
- Run `npm start` in the project directory with one SteamID in the userdata folder. The app should auto-select it.
- Add a second SteamID folder and run `npm start` again. The app should prompt you to select which SteamID to use.
- Click the "Change SteamID" button in the UI to re-select your SteamID at any time.
- Run `npm start -- --flush` to delete all user settings. The app should prompt for SteamID selection again on next launch.

## Step 10: Config Path Construction and Persistence (Completed)
- Updated the app to persist the manually selected config path in user-settings.json.
- When the user selects a config folder, the path is saved and used for future launches.
- On app launch, if a manual config path is set, it is displayed in the UI (with a '(manual)' indicator) and used for all operations.
- If no manual path is set, the app falls back to automatic SteamID-based detection.
- Added an IPC handler to clear the manual config path (for future UX improvements).

**How to test:**
- Run `npm start` in the project directory.
- Click the "Select Config Folder" button and choose a folder.
- Confirm the config path display updates and shows '(manual)'.
- Restart the app and verify the manual path persists.
- Optionally, clear the manual path (feature for future) and confirm the app returns to automatic detection.

## Step 11: Backup Existing Grid with Warning Logic (Completed)
- Implemented logic in the main process (main.js) to back up the existing hero_grid_config.json as hero_grid_config_backup.json before replacing it.
- On the first run, the app shows a warning dialog to inform the user that the backup will be overwritten on each update. This warning is only shown once (unless running in silent/background mode).
- The backup step is now triggered from the UI before downloading and replacing the grid.
- Status messages are shown in the UI for backup and download steps.

**How to test:**
- Place a test hero_grid_config.json in the config folder.
- Click "Download & Update" in the app.
- Confirm that a backup is created (hero_grid_config_backup.json) and the warning appears the first time.
- On subsequent runs, confirm the backup is silently overwritten and no warning is shown.
- If no grid exists, confirm the app proceeds to download without backup or warning.

---
