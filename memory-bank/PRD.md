# Product Requirements Document (PRD)

## Project: Dota 2 Meta Hero Grid Updater

### Overview

A lightweight desktop application to automate the process of downloading the latest "meta hero grid" from [dota2protracker.com/meta-hero-grids](https://dota2protracker.com/meta-hero-grids) and updating the user's Dota 2 configuration. The app will allow users to select from the "Most Played", "High Win Rate", or "D2PT Rating" hero grids, back up their existing grid, and replace it with the new one.  
**Now includes automatic detection of the user's SteamID.**

---

## Goals

- Simplify the process of updating Dota 2 hero grids for users.
- Ensure user data safety by backing up existing configurations.
- Provide a clean, intuitive, and minimal user interface.
- Automatically detect the user's SteamID for a seamless experience.

---

## User Stories

- **As a user**, I want to select which meta hero grid I want to download (Most Played, High Win Rate, D2PT Rating).
- **As a user**, I want the app to automatically detect my SteamID and locate my Dota 2 config folder.
- **As a user**, I want the app to automatically back up my current hero grid before making changes.
- **As a user**, I want the app to replace my current hero grid with the downloaded one.
- **As a user**, I want to be notified of success or failure at each step.

---

## Functional Requirements

1. **Grid Selection**
   - UI presents three options: Most Played, High Win Rate, D2PT Rating.
   - Each option corresponds to a downloadable JSON file from [dota2protracker.com/meta-hero-grids](https://dota2protracker.com/meta-hero-grids).

2. **Download Grid**
   - On selection, the app fetches the corresponding JSON file from the website.

3. **Automatic SteamID Detection**
   - The app scans the directory:  
     `C:\Program Files (x86)\Steam\userdata\`
   - Assumes the only directory present is the user's SteamID.
   - Constructs the config path:  
     `C:\Program Files (x86)\Steam\userdata\<SteamID>\570\remote\cfg`
   - If multiple directories are found, prompt the user to select one.

4. **Backup Existing Grid**
   - If `hero_grid_config.json` exists, rename it to `hero_grid_config_backup.json`.

5. **Replace Grid**
   - Save the downloaded JSON as `hero_grid_config.json` in the config folder.

6. **Notifications**
   - Inform the user of each step's success or failure (download, backup, replace).

7. **Manual Override**
   - Allow the user to manually select the config folder if automatic detection fails.

---

## Non-Functional Requirements

- **Platform:** Windows (Win32)
- **Performance:** App should launch and complete all operations within a few seconds.
- **Security:** No data is sent anywhere except to download the grid; no telemetry.
- **Size:** Lightweight, minimal dependencies.

---

## User Interface

- Simple window with:
  - Three radio buttons or dropdown for grid selection.
  - "Download & Update" button.
  - Status area for notifications.
  - Display of detected SteamID and config path.
  - Option to change the config folder path if needed.

---

## Error Handling

- If the config folder is not found, prompt the user to select it.
- If multiple SteamIDs are found, prompt the user to choose.
- If download fails, show an error and allow retry.
- If backup or file operations fail, show a clear error message.

---

## Out of Scope

- No advanced settings or scheduling beyond weekly.
- No support for platforms other than Windows.

---

## References

- [Dota2ProTracker Meta Hero Grids](https://dota2protracker.com/meta-hero-grids)

--- 