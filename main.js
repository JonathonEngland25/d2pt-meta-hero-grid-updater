const { app, BrowserWindow, dialog, ipcMain, Notification, Tray, Menu } = require('electron');
const path = require('path');
const gotImport = require('got');
const got = gotImport.default ? gotImport.default : gotImport;
const { URL } = require('url');
const puppeteer = require('puppeteer');
const fs = require('fs');

app.setName('d2pt-meta-hero-grid-updater');

let tray = null;
let mainWindow = null;
let preferencesWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadFile('index.html');

  // Minimize to tray or exit on close with confirmation dialog or persisted preference
  mainWindow.on('close', async (event) => {
    if (!app.isQuiting) {
      let settings = loadPersistedSettings();
      const closeAction = settings.closeAction || 'ask';
      if (closeAction === 'minimize') {
        event.preventDefault();
        mainWindow.hide();
        return false;
      } else if (closeAction === 'exit') {
        app.isQuiting = true;
        app.quit();
        return false;
      } else {
        event.preventDefault();
        const win = mainWindow;
        const result = await dialog.showMessageBox(win, {
          type: 'question',
          title: 'Close Application',
          message: 'Do you want to minimize the app to the system tray or exit completely?',
          detail: 'You can restore the app from the tray icon at any time.',
          buttons: ['Minimize to Tray', 'Exit', 'Cancel'],
          defaultId: 0,
          cancelId: 2,
          noLink: true,
          checkboxLabel: 'Remember my choice',
          checkboxChecked: false
        });
        if (result.response === 0) { // Minimize to Tray
          if (result.checkboxChecked) {
            settings.closeAction = 'minimize';
            savePersistedSettings(settings);
          }
          mainWindow.hide();
        } else if (result.response === 1) { // Exit
          if (result.checkboxChecked) {
            settings.closeAction = 'exit';
            savePersistedSettings(settings);
          }
          app.isQuiting = true;
          app.quit();
        } // else Cancel: do nothing
        return false;
      }
    }
    return false;
  });

  // Minimize to tray on minimize
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}

app.whenReady().then(() => {
  createWindow();

  // Add application menu with File > Preferences
  const isMac = process.platform === 'darwin';
  const template = [
    {
      label: 'File',
      submenu: [
        { role: isMac ? 'close' : 'quit' }
      ]
    },
    {
      label: 'Preferences',
      accelerator: isMac ? 'Cmd+,' : 'Ctrl+,',
      click: () => {
        if (preferencesWindow && !preferencesWindow.isDestroyed()) {
          preferencesWindow.show();
          preferencesWindow.focus();
          return;
        }
        preferencesWindow = new BrowserWindow({
          width: 540,
          height: 340,
          resizable: false,
          minimizable: false,
          maximizable: false,
          parent: mainWindow,
          modal: false,
          show: false,
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
          },
        });
        preferencesWindow.setMenuBarVisibility(false);
        preferencesWindow.loadFile('preferences.html');
        preferencesWindow.once('ready-to-show', () => {
          preferencesWindow.show();
        });
        preferencesWindow.on('closed', () => {
          preferencesWindow = null;
        });
      }
    },
    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'About',
              message: 'Dota 2 Meta Hero Grid Updater',
              detail: 'This app helps you download and update your in-game meta hero grids for Dota 2 from dota2protracker.com.\n\nCreated by Jonathon England.'
            });
          }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Tray support
  if (!tray) {
    // Always use icon.ico for the tray icon
    const iconPath = path.join(__dirname, 'icon.ico');
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Exit',
        click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    ]);
    tray.setToolTip('Dota 2 Meta Hero Grid Updater');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  }
});

app.on('window-all-closed', () => {
  // Do not quit the app when all windows are closed (for tray support)
  // Only quit on explicit Exit
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.handle('get-config-path', async (event) => {
  let settings = loadPersistedSettings();
  if (settings.configPath && fs.existsSync(settings.configPath)) {
    return { configPath: settings.configPath };
  } else {
    return { configPath: null };
  }
});

ipcMain.handle('select-config-folder', async (event) => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    title: 'Select Dota 2 Config Folder'
  });
  if (result.canceled || !result.filePaths || !result.filePaths[0]) {
    return null;
  }
  let settings = loadPersistedSettings();
  settings.configPath = result.filePaths[0];
  savePersistedSettings(settings);
  return result.filePaths[0];
});

ipcMain.handle('clear-manual-config-path', async () => {
  let settings = loadPersistedSettings();
  delete settings.manualConfigPath;
  savePersistedSettings(settings);
  return { success: true };
});

// Phase 8: Download Grid Logic
const GRID_TYPE_TO_MODE = {
  'Most Played': 'matches',
  'High Win Rate': 'matches_wr',
  'D2PT Rating': 'd2ptrating',
};

const ERROR_LOG_FILE = path.join(app.getPath('userData'), 'error.log');
function logError(context, err) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] [${context}] ${err && err.message ? err.message : err}\n${err && err.stack ? err.stack : ''}\n`;
  try {
    fs.appendFileSync(ERROR_LOG_FILE, message, 'utf-8');
  } catch (e) {
    // If logging fails, there's not much we can do
  }
}

ipcMain.handle('download-grid-json', async (event, gridType) => {
  try {
    const url = 'https://dota2protracker.com/meta-hero-grids';
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('a[href*="/downloads/meta-hero-grid"]', { timeout: 10000 });
    const mode = GRID_TYPE_TO_MODE[gridType];
    const links = await page.$$eval('a[href*="/downloads/meta-hero-grid"]', els =>
      els.map(el => ({ href: el.getAttribute('href') }))
    );
    let downloadUrl = null;
    for (let i = 0; i < links.length; i++) {
      const href = links[i].href;
      if (!href) continue;
      let fullUrl = href.startsWith('http') ? href : 'https://dota2protracker.com' + href;
      try {
        const parsed = new URL(fullUrl);
        const parsedMode = parsed.searchParams.get('mode');
        if (parsed.pathname === '/downloads/meta-hero-grid' && parsedMode === mode) {
          downloadUrl = fullUrl;
          break;
        }
      } catch (e) {}
    }
    await browser.close();
    if (!downloadUrl) {
      throw new Error('Could not find download link for selected grid type.');
    }
    const jsonResponse = await got(downloadUrl);
    let json;
    try {
      json = JSON.parse(jsonResponse.body);
    } catch (e) {
      throw new Error('Downloaded file is not valid JSON.');
    }
    maybeNotify('Download Successful', `Grid JSON for ${gridType} downloaded.`);
    return { success: true, json };
  } catch (err) {
    logError('download-grid-json', err);
    maybeNotify('Download Failed', err.message);
    return { success: false, error: err.message };
  }
});

// Phase 9: SteamID Detection, Selection, and Persistence
const APP_DATA_PATH = app.getPath('userData');
const PERSIST_FILE = path.join(APP_DATA_PATH, 'user-settings.json');

function loadPersistedSettings() {
  try {
    if (fs.existsSync(PERSIST_FILE)) {
      return JSON.parse(fs.readFileSync(PERSIST_FILE, 'utf-8'));
    }
  } catch (e) {}
  return {};
}

function savePersistedSettings(settings) {
  try {
    fs.writeFileSync(PERSIST_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (e) {}
}

// Argument parsing for --flush
let args = process.argv;
if (process.defaultApp) {
  args = args.slice(2);
} else {
  args = args.slice(1);
}

// Flush user settings if --flush is passed
if (args.includes('--flush')) {
  try {
    if (fs.existsSync(PERSIST_FILE)) {
      fs.unlinkSync(PERSIST_FILE);
    }
  } catch (e) {
    // Silently ignore errors
  }
}

// Phase 11: Backup Existing Grid with Warning Logic
ipcMain.handle('backup-hero-grid', async (event, { configPath, silent }) => {
  const gridFile = path.join(configPath, 'hero_grid_config.json');
  const backupFile = path.join(configPath, 'hero_grid_config_backup.json');
  let settings = loadPersistedSettings();
  let warned = settings.backupWarningShown;
  let didBackup = false;
  let warningShown = false;
  try {
    if (fs.existsSync(gridFile)) {
      // Show warning only on first run, unless silent
      if (!warned && !silent) {
        const win = BrowserWindow.getFocusedWindow();
        await dialog.showMessageBox(win, {
          type: 'warning',
          title: 'Backup Notice',
          message: 'Your existing hero_grid_config.json will be backed up as hero_grid_config_backup.json. This backup will be overwritten each time you update.',
          buttons: ['OK']
        });
        settings.backupWarningShown = true;
        savePersistedSettings(settings);
        warningShown = true;
      }
      // Overwrite backup if it exists
      if (fs.existsSync(backupFile)) {
        fs.unlinkSync(backupFile);
      }
      fs.renameSync(gridFile, backupFile);
      didBackup = true;
      maybeNotify('Grid Backup', 'Existing hero_grid_config.json backed up successfully.');
    }
    return { success: true, didBackup, warningShown };
  } catch (err) {
    logError('backup-hero-grid', err);
    maybeNotify('Backup Failed', err.message);
    return { success: false, error: err.message };
  }
});

// Phase 12: Replace Grid (Save Downloaded JSON as hero_grid_config.json)
ipcMain.handle('replace-hero-grid', async (event, { configPath, json }) => {
  const gridFile = path.join(configPath, 'hero_grid_config.json');
  try {
    fs.writeFileSync(gridFile, JSON.stringify(json, null, 2), 'utf-8');
    maybeNotify('Grid Updated', 'hero_grid_config.json updated successfully.');
    return { success: true };
  } catch (err) {
    logError('replace-hero-grid', err);
    maybeNotify('Update Failed', err.message);
    return { success: false, error: err.message };
  }
});

// Helper: Show Windows notification if enabled
function maybeNotify(title, body) {
  let settings = loadPersistedSettings();
  if (settings.enableWindowsNotifications) {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  }
}

// IPC to get/set notification setting
ipcMain.handle('get-notification-setting', async () => {
  let settings = loadPersistedSettings();
  return { enabled: !!settings.enableWindowsNotifications };
});

ipcMain.handle('set-notification-setting', async (event, enabled) => {
  let settings = loadPersistedSettings();
  settings.enableWindowsNotifications = !!enabled;
  savePersistedSettings(settings);
  return { success: true };
});

// Add at top-level, after other IPC handlers
ipcMain.handle('get-close-action-setting', async () => {
  let settings = loadPersistedSettings();
  return settings.closeAction || 'ask';
});
ipcMain.handle('set-close-action-setting', async (event, value) => {
  let settings = loadPersistedSettings();
  settings.closeAction = value;
  savePersistedSettings(settings);
  return { success: true };
}); 