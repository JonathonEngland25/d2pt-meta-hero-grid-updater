# Architecture Notes

## Files and Their Purpose

- `package.json`: Project manifest. Defines dependencies, scripts, and metadata for the Node.js/Electron app.
- `main.js`: Electron main process. Responsible for creating the application window and loading the UI. No direct UI logic; delegates all UI to index.html.
- `index.html`: Main UI for the app. Now includes radio buttons for grid selection ("Most Played", "High Win Rate", "D2PT Rating") and JavaScript to update the selected grid display live. Handles all user interaction for grid selection.

---
