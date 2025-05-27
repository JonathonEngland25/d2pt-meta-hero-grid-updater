# Implementation Plan: Dota 2 Meta Hero Grid Updater

## 1. Project Setup

**Step:**  
Initialize a new Electron + Node.js project with a minimal UI (HTML/CSS/JS or React).

**Test:**  
Run the app and verify a window opens with a placeholder UI.

---

## 2. UI: Grid Selection

**Step:**  
Add three radio buttons or a dropdown for grid selection: "Most Played", "High Win Rate", "D2PT Rating".

**Test:**  
Select each option and verify the selection state updates in the UI.

---

## 3. UI: Download & Update Button

**Step:**  
Add a "Download & Update" button to the UI.

**Test:**  
Click the button and verify a click event is triggered (e.g., log to console).

---

## 4. UI: Status Area

**Step:**  
Add a status area to display notifications and operation results.

**Test:**  
Trigger a test notification and verify it appears in the status area.

---

## 5. UI: SteamID & Config Path Display

**Step:**  
Add a section to display the detected SteamID and config folder path.

**Test:**  
Set test values for SteamID and path, and verify they display correctly.

---

## 6. UI: Manual Config Path Selection

**Step:**  
Add a button or input to allow manual selection of the config folder.

**Test:**  
Click the button, select a folder, and verify the path updates in the UI.

---

## 7. UI: Scheduling Section

**Step:**  
Add a section with:
- "Schedule Weekly Update" button
- Day/time picker
- Display of current schedule status
- Button to remove/modify schedule

**Test:**  
Interact with each element and verify UI state changes as expected.

---

## 8. Download Grid Logic (Dynamic Scraping)

**Step:**  
Implement logic to dynamically scrape dota2protracker.com/meta-hero-grids for the latest download links for each grid type (Most Played, High Win Rate, D2PT Rating). Fetch the selected grid JSON.

**Test:**  
Select a grid, trigger download, and verify the correct JSON is fetched (log or display content).

---

## 9. SteamID Detection, Selection, and Persistence

**Step:**  
Scan `C:\Program Files (x86)\Steam\userdata\` for directories. If one, use as SteamID. If multiple, display a dialog listing all SteamIDs and prompt the user to select one, with an explanation (e.g., "please choose your SteamID which contains the Dota 2 cfg file"). Remember the user's choice for future runs.

**Test:**  
Test with one and multiple directories; verify correct SteamID is selected or prompt appears. Confirm persistence of the choice across app restarts.

---

## 10. Config Path Construction and Persistence

**Step:**  
Construct the config path:  
`C:\Program Files (x86)\Steam\userdata\<SteamID>\570\remote\cfg`  
If the user manually selects a config path, persist this choice for future launches.

**Test:**  
Given a SteamID or manual selection, verify the correct path is constructed, displayed, and persists across app restarts.

---

## 11. Backup Existing Grid with Warning Logic

**Step:**  
If `hero_grid_config.json` exists in the config folder, rename it to `hero_grid_config_backup.json`. On first app run, warn the user that the backup will be overwritten on each run. No notification is needed for backup overwrites during scheduled/silent runs.

**Test:**  
Place a test file, run backup logic, and verify the backup file is created and original is removed. Confirm warning is shown only on first run.

---

## 12. Replace Grid

**Step:**  
Save the downloaded JSON as `hero_grid_config.json` in the config folder.

**Test:**  
After backup, run replace logic and verify the new file exists with correct content.

---

## 13. Notifications and Windows Notifications Option

**Step:**  
Display success or failure notifications for download, backup, and replace steps in the status area. Provide an option to enable Windows notifications for these events, including in silent/background mode.

**Test:**  
Simulate each operation (success/failure) and verify correct notification appears in the status area and/or as a Windows notification if enabled.

---

## 14. Manual Override for Config Path (Persistent)

**Step:**  
If automatic detection fails, prompt the user to manually select the config folder. Persist this override for future runs.

**Test:**  
Simulate detection failure and verify the manual selection prompt appears, updates the path, and persists.

---

## 15. Windows Task Scheduler Integration (Terminate Running Instance)

**Step:**  
Implement logic to create a scheduled task using Windows Task Scheduler to run the updater weekly at user-specified day/time. If the app is already running at the scheduled time, terminate the running instance before starting a new one. The task runs as the current user.

**Test:**  
Schedule a task, verify it appears in Task Scheduler, and confirm next run time matches user input. Simulate the app running at scheduled time and confirm it is terminated and restarted.

---

## 16. Silent/Background Mode with Logging

**Step:**  
Support a `--silent` or `--background` CLI flag to run the app without UI for scheduled tasks. Write error logs to a local `error.log` file in the app directory. Optionally show Windows notifications if enabled.

**Test:**  
Run the app with the flag and verify all operations complete with no UI, errors are logged, and notifications are handled as configured.

---

## 17. View/Modify/Remove Scheduled Task

**Step:**  
Provide UI options to view, modify, or remove the scheduled task.

**Test:**  
Use each option and verify the scheduled task is correctly displayed, updated, or deleted in Task Scheduler.

---

## 18. Scheduling Status Notifications

**Step:**  
Notify the user of scheduling actions (success, failure, next scheduled run) in the status area and/or via Windows notifications if enabled.

**Test:**  
Perform scheduling actions and verify notifications display correct status and next run info.

---

## 19. Error Handling and Logging

**Step:**  
Handle errors for config folder not found, multiple SteamIDs, download failure, file operation failure, and scheduling failure. Show clear error messages and troubleshooting tips in the status area and/or via Windows notifications if enabled. Log all errors to `error.log`.

**Test:**  
Simulate each error scenario and verify the correct error message, guidance, and logging.

---

## 20. Tray Support for Background Operation

**Step:**  
Support minimizing and closing the app to the system tray for background operation.

**Test:**  
Minimize or close the app and verify it remains running in the tray, with the ability to restore or exit.

---

## 21. Final User Acceptance Test

**Step:**  
Run through all user stories in the PRD, from initial launch to scheduling and error handling, to ensure all requirements are met.

**Test:**  
Complete each user story as described and verify the app behaves as expected at every step.

---

**Other Notes:**
- English only; no localization required.
- No auto-update mechanism; manual updates only.
- Minimalist UI is sufficient.
- Manual testing is sufficient; no automated tests required.

**End of Implementation Plan** 