# Tech Stack for Dota 2 Meta Hero Grid Updater

## Platform & Language
- **Electron + Node.js**
  - Build a Windows desktop app using web technologies (HTML, CSS, JS) with Node.js for filesystem and OS integration.

## UI Framework
- **Vanilla HTML/CSS/JS** or **React** (optional)
  - Use plain HTML/CSS/JS for a minimal UI, or React for better state management and scalability.

## Windows Integration
- **Node.js child_process**
  - For running Windows Task Scheduler commands (`schtasks.exe`).
- **Node.js fs module**
  - For file operations (backup, replace, etc.).

## Packaging
- **electron-builder** or **electron-forge**
  - To package the app as a single Windows `.exe` for easy distribution.

## Summary Table

| Layer         | Choice                | Why                                      |
|---------------|-----------------------|------------------------------------------|
| Language      | JavaScript (Node.js)  | Simple, robust, easy file/OS access      |
| UI            | HTML/CSS/JS or React  | Minimal UI, fast to build                |
| Desktop Shell | Electron              | Native-feeling Windows app, easy to ship |
| Windows API   | Node.js child_process | For Task Scheduler integration           |
| Packaging     | electron-builder      | Create a distributable `.exe`            |

## Notes
- This stack is chosen for its simplicity, robustness, and ease of development for a lightweight Windows desktop app.
- If a more native look is desired and you are comfortable with C#, consider C# with WPF as an alternative. 