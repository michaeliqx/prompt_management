import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createFloatBallWindow, setMainWindow, getFloatBallWindow, setRecreateMainWindowFn } from './floatBall.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
// 调试模式：开发时默认开启，也可通过 ELECTRON_DEBUG=1 在打包后开启
const isDebug = isDev || process.env.ELECTRON_DEBUG === '1';

let mainWindow = null;

function getIconPath() {
  return path.join(__dirname, isDev ? '../public/logo.png' : '../dist/logo.png');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#050505',
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // 监听窗口最大化/还原事件
  mainWindow.on('maximize', () => {
    if (mainWindow) {
      mainWindow.webContents.send('window-maximized', true);
    }
  });

  mainWindow.on('unmaximize', () => {
    if (mainWindow) {
      mainWindow.webContents.send('window-unmaximized', false);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    setMainWindow(null); // 同步清除 floatBall 中的主窗口引用，便于“点击悬浮球重新打开主窗口”逻辑一致
  });

  if (isDev) {
    mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
      console.error('[主窗口] 加载失败:', code, desc, url);
    });
    mainWindow.webContents.on('did-finish-load', () => {
      if (isDebug) {
        mainWindow.webContents.openDevTools();
      }
    });
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.webContents.on('did-finish-load', () => {
      if (isDebug) {
        mainWindow.webContents.openDevTools();
      }
    });
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

// 点击桌面图标时：若本进程仍在运行则走到这里，唤醒/创建主窗口并聚焦；若本进程已退出则由新进程获得锁并创建主窗口
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

// 注册窗口控制 IPC 处理器
function registerWindowHandlers() {
  ipcMain.handle('window-minimize', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.handle('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window-close', () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });

  ipcMain.handle('window-is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });
}

function registerDevToolsShortcuts() {
  const toggleDevTools = () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win && win.webContents) {
      win.webContents.toggleDevTools();
    }
  };
  globalShortcut.register('F12', toggleDevTools);
  globalShortcut.register('CommandOrControl+Shift+I', toggleDevTools);
}

function unregisterDevToolsShortcuts() {
  globalShortcut.unregister('F12');
  globalShortcut.unregister('CommandOrControl+Shift+I');
}

app.whenReady().then(() => {
  registerWindowHandlers();
  registerDevToolsShortcuts();
  createWindow();
  setRecreateMainWindowFn(ensureMainWindow);

  setTimeout(() => {
    createFloatBallWindow();
  }, 1000);
});

app.on('will-quit', () => {
  unregisterDevToolsShortcuts();
});

app.on('window-all-closed', () => {
  const floatBall = getFloatBallWindow();
  if (mainWindow === null && !floatBall) {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});
