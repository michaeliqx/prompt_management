import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createFloatBallWindow, setMainWindow, getFloatBallWindow, setRecreateMainWindowFn } from './floatBall.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  setMainWindow(mainWindow);
}

export function ensureMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    return mainWindow;
  }
  return mainWindow;
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  const window = ensureMainWindow();
  if (window) {
    if (window.isMinimized()) {
      window.restore();
    }
    window.show();
    window.focus();
  }
});

app.whenReady().then(() => {
  createWindow();
  setRecreateMainWindowFn(ensureMainWindow);
  
  setTimeout(() => {
    createFloatBallWindow();
  }, 1000);
});

app.on('window-all-closed', () => {
  const floatBall = getFloatBallWindow();
  if (mainWindow === null && !floatBall) {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});
