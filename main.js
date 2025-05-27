const { app, BrowserWindow, dialog, ipcMain, Notification, Tray, Menu } = require('electron');
const path = require('path');
const gotImport = require('got');
const cheerio = require('cheerio');
const got = gotImport.default ? gotImport.default : gotImport;
const { URL } = require('url');
const puppeteer = require('puppeteer');
const fs = require('fs');
const os = require('os');

app.setName('d2pt-meta-hero-grid-updater');

let tray = null;
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadFile('index.html');

  // Minimize to tray on close
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
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
  // Tray support
  if (!tray) {
    // Use Electron's default icon if no custom icon is available
    const iconPath = process.platform === 'win32'
      ? path.join(__dirname, 'icon.ico')
      : path.join(__dirname, 'icon.png');
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

ipcMain.handle('select-config-folder', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return null;
  }
  // Persist the selected config path
  let settings = loadPersistedSettings();
  settings.manualConfigPath = result.filePaths[0];
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
const STEAM_USERDATA_PATH = 'C:\\Program Files (x86)\\Steam\\userdata';

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

async function detectSteamID(win, forceSelect = false) {
  let settings = loadPersistedSettings();
  let steamid = null;
  try {
    if (fs.existsSync(STEAM_USERDATA_PATH)) {
      const dirs = fs.readdirSync(STEAM_USERDATA_PATH, { withFileTypes: true })
        .filter(d => d.isDirectory() && /^\d+$/.test(d.name))
        .map(d => d.name);
      if (dirs.length === 1) {
        steamid = dirs[0];
      } else if (dirs.length > 1 && win) {
        if (forceSelect || !settings.steamid) {
          const { response } = await dialog.showMessageBox(win, {
            type: 'question',
            buttons: dirs,
            title: 'Select SteamID',
            message: 'Multiple SteamIDs found. Please select your SteamID (the one with Dota 2 config).',
            defaultId: 0,
            cancelId: -1
          });
          if (response >= 0 && response < dirs.length) {
            steamid = dirs[response];
          }
        } else {
          steamid = settings.steamid;
        }
      }
      if (steamid) {
        settings.steamid = steamid;
        savePersistedSettings(settings);
        return steamid;
      }
    }
  } catch (e) {
    logError('detectSteamID', e);
  }
  return null;
}

function getConfigPath(steamid) {
  return `C:\\Program Files (x86)\\Steam\\userdata\\${steamid}\\570\\remote\\cfg`;
}

ipcMain.handle('get-steamid-and-config-path', async (event, opts = {}) => {
  const win = BrowserWindow.getFocusedWindow();
  let forceSelect = opts.forceSelect || false;
  let settings = loadPersistedSettings();
  try {
    if (settings.manualConfigPath) {
      if (fs.existsSync(settings.manualConfigPath)) {
        return {
          steamid: settings.steamid || null,
          configPath: settings.manualConfigPath,
          manual: true
        };
      } else {
        const errorMsg = 'Manual config path does not exist. Please select your config folder again.';
        logError('get-steamid-and-config-path', new Error(errorMsg));
        return {
          steamid: settings.steamid || null,
          configPath: null,
          manual: true,
          error: errorMsg
        };
      }
    }
    let steamid = null;
    if (!forceSelect && settings.steamid) {
      steamid = settings.steamid;
    } else {
      steamid = await detectSteamID(win, forceSelect);
    }
    if (steamid) {
      const configPath = getConfigPath(steamid);
      if (fs.existsSync(configPath)) {
        return {
          steamid,
          configPath,
          manual: false
        };
      } else {
        const errorMsg = 'Detected config path does not exist. Please select your config folder.';
        logError('get-steamid-and-config-path', new Error(errorMsg));
        return {
          steamid,
          configPath: null,
          manual: false,
          error: errorMsg
        };
      }
    } else {
      const errorMsg = 'Could not detect SteamID. Please select config folder manually.';
      logError('get-steamid-and-config-path', new Error(errorMsg));
      return {
        steamid: null,
        configPath: null,
        error: errorMsg
      };
    }
  } catch (err) {
    logError('get-steamid-and-config-path', err);
    return {
      steamid: null,
      configPath: null,
      error: 'Unexpected error during SteamID/config detection.'
    };
  }
});

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