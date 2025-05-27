const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const gotImport = require('got');
const cheerio = require('cheerio');
const got = gotImport.default ? gotImport.default : gotImport;
const { URL } = require('url');
const puppeteer = require('puppeteer');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('select-config-folder', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('schedule-weekly-update', async (event, { day, time }) => {
  console.log(`Simulating scheduling: Weekly update on ${day} at ${time}`);
  // Simulate success
  return { success: true };
});

ipcMain.handle('remove-weekly-schedule', async (event) => {
  console.log('Simulating removal of scheduled weekly update');
  // Simulate success
  return { success: true };
});

// Phase 8: Download Grid Logic
const GRID_TYPE_TO_MODE = {
  'Most Played': 'matches',
  'High Win Rate': 'matches_wr',
  'D2PT Rating': 'd2ptrating',
};

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
    return { success: true, json };
  } catch (err) {
    return { success: false, error: err.message };
  }
}); 