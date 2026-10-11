const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Check if we are running in development mode
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../dist/index.html'),
    protocol: 'file:',
    slashes: true
  });

  mainWindow.loadURL(startUrl);

  // Automatically open DevTools in dev mode
  if (process.env.ELECTRON_START_URL) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  // Check for updates on startup
  autoUpdater.checkForUpdatesAndNotify();

  // Check for updates every 5 minutes (300,000 ms)
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 300000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Helper to send messages to React
function sendToReact(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

// Auto-updater events
autoUpdater.on('update-available', (info) => {
  sendToReact('updater:available', info);
});

autoUpdater.on('download-progress', (progressObj) => {
  sendToReact('updater:progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  sendToReact('updater:downloaded', info);
});

autoUpdater.on('error', (err) => {
  sendToReact('updater:error', err.toString());
});

// Receive command from React to install the update
ipcMain.on('updater:install', () => {
  autoUpdater.quitAndInstall();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
