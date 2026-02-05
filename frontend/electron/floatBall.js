import { app, BrowserWindow, screen, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let recreateMainWindowFn = null;
let floatBallWindow = null;
let mainWindow = null;

export function setRecreateMainWindowFn(fn) {
  recreateMainWindowFn = fn;
}

function ensureMainWindowExists() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }
  if (recreateMainWindowFn) {
    recreateMainWindowFn();
    if (mainWindow && !mainWindow.isDestroyed()) {
      return mainWindow;
    }
  }
  return null;
}

class CustomWindowMove {
  constructor() {
    this.isOpen = false;
    this.win = null;
    this.winStartPosition = { x: 0, y: 0 };
    this.startPosition = { x: 0, y: 0 };
  }

  init(win) {
    this.win = win;
  }

  start() {
    if (!this.win || this.win.isDestroyed()) {
      return;
    }
    this.isOpen = true;
    const winPosition = this.win.getPosition();
    this.winStartPosition.x = winPosition[0];
    this.winStartPosition.y = winPosition[1];
    const mouseStartPosition = screen.getCursorScreenPoint();
    this.startPosition.x = mouseStartPosition.x;
    this.startPosition.y = mouseStartPosition.y;
    this.move();
  }

  move() {
    if (!this.isOpen || !this.win || this.win.isDestroyed()) {
      this.end();
      return;
    }

    const cursorPosition = screen.getCursorScreenPoint();
    if (!isFinite(cursorPosition.x) || !isFinite(cursorPosition.y)) {
      this.end();
      return;
    }

    let x = this.winStartPosition.x + cursorPosition.x - this.startPosition.x;
    let y = this.winStartPosition.y + cursorPosition.y - this.startPosition.y;

    const bounds = this.win.getBounds();
    const display = screen.getDisplayMatching(bounds);
    const { x: workAreaX, y: workAreaY, width: workAreaWidth, height: workAreaHeight } = display.workArea;
    
    const ballSize = 40;
    const ballTopInWindow = 300;
    const ballLeftInWindow = bounds.width / 2;
    
    const ballLeft = x + ballLeftInWindow - ballSize / 2;
    const ballRight = x + ballLeftInWindow + ballSize / 2;
    const ballTop = y + ballTopInWindow;
    const ballBottom = y + ballTopInWindow + ballSize;
    
    if (ballLeft < workAreaX) {
      x = workAreaX - ballLeftInWindow + ballSize / 2;
    }
    if (ballRight > workAreaX + workAreaWidth) {
      x = workAreaX + workAreaWidth - ballLeftInWindow - ballSize / 2;
    }
    if (ballTop < workAreaY) {
      y = workAreaY - ballTopInWindow;
    }
    if (ballBottom > workAreaY + workAreaHeight) {
      y = workAreaY + workAreaHeight - ballTopInWindow - ballSize;
    }

    try {
      this.win.setPosition(Math.round(x), Math.round(y));
    } catch (error) {
      console.error('[悬浮球] 设置窗口位置失败:', error);
      this.end();
      return;
    }

    if (this.isOpen) {
      setTimeout(() => {
        this.move();
      }, 16);
    }
  }

  end() {
    if (!this.win || this.win.isDestroyed()) {
      this.isOpen = false;
      return;
    }
    this.isOpen = false;
  }
}

let floatMoveEvent = null;

export function setMainWindow(window) {
  mainWindow = window;
}

export function createFloatBallWindow() {
  if (floatBallWindow && !floatBallWindow.isDestroyed()) {
    registerFloatBallHandlers();
    return floatBallWindow;
  }

  const display = screen.getPrimaryDisplay();
  const { x: workAreaX, y: workAreaY, width: workAreaWidth, height: workAreaHeight } = display.workArea;
  
  const WINDOW_WIDTH = 500;
  const WINDOW_HEIGHT = 640;
  const BALL_SIZE = 40;
  const BALL_TOP_IN_WINDOW = 300;
  const BALL_CENTER_X_IN_WINDOW = WINDOW_WIDTH / 2;
  const BALL_RIGHT_OFFSET = BALL_CENTER_X_IN_WINDOW + BALL_SIZE / 2;
  
  const windowX = Math.floor(workAreaX + workAreaWidth - BALL_RIGHT_OFFSET);
  const windowY = Math.floor(workAreaY + (workAreaHeight - WINDOW_HEIGHT) / 2);
  
  floatBallWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: windowX,
    y: windowY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: true,
    hasShadow: false,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  floatBallWindow.setIgnoreMouseEvents(true, { forward: true });
  floatBallWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  floatBallWindow.setMenuBarVisibility(false);

  if (isDev) {
    floatBallWindow.loadURL('http://localhost:5173/float-ball.html');
  } else {
    floatBallWindow.loadFile(path.join(__dirname, '../dist/float-ball.html'));
  }
  
  floatBallWindow.show();

  floatBallWindow.on('closed', () => {
    floatBallWindow = null;
  });

  floatMoveEvent = new CustomWindowMove();
  floatMoveEvent.init(floatBallWindow);

  const handleGlobalMouseUp = () => {
    if (floatMoveEvent && floatMoveEvent.isOpen) {
      floatMoveEvent.end();
    }
  };

  floatBallWindow.on('blur', () => {
    if (floatMoveEvent && floatMoveEvent.isOpen) {
      floatMoveEvent.end();
    }
  });

  registerFloatBallHandlers();

  return floatBallWindow;
}

let floatBallHandlersRegistered = false;
function registerFloatBallHandlers() {
  if (floatBallHandlersRegistered) {
    return;
  }

  ipcMain.handle('float-ball-close', () => {
    if (floatBallWindow) {
      floatBallWindow.close();
    }
  });

  ipcMain.handle('float-ball-open-main', () => {
    const window = ensureMainWindowExists();
    if (window) {
      if (window.isMinimized()) {
        window.restore();
      }
      window.show();
      window.focus();
    }
  });

  ipcMain.handle('float-ball-navigate', (event, route) => {
    const window = ensureMainWindowExists();
    if (window) {
      if (window.isMinimized()) {
        window.restore();
      }
      window.show();
      window.focus();
      
      setTimeout(() => {
        if (window && !window.isDestroyed()) {
          window.webContents.executeJavaScript(`
            (function() {
              const event = new CustomEvent('navigate-to', { detail: '${route}' });
              window.dispatchEvent(event);
            })();
          `).catch(err => {
            console.error('[悬浮球] 发送导航事件失败:', err);
          });
        }
      }, 800);
    }
  });

  ipcMain.handle('float-ball-get-position', () => {
    if (floatBallWindow) {
      const bounds = floatBallWindow.getBounds();
      return { x: bounds.x, y: bounds.y };
    }
    return null;
  });

  ipcMain.handle('float-ball-set-position', (event, x, y) => {
    if (floatBallWindow) {
      floatBallWindow.setPosition(x, y);
    }
  });

  ipcMain.handle('float-ball-set-size', (event, width, height) => {
    if (floatBallWindow && !floatBallWindow.isDestroyed()) {
      floatBallWindow.setSize(Math.round(width), Math.round(height));
    }
  });

  ipcMain.handle('float-ball-set-ignore-mouse-events', (event, ignore, options) => {
    if (floatBallWindow && !floatBallWindow.isDestroyed()) {
      floatBallWindow.setIgnoreMouseEvents(ignore, options || {});
    }
  });

  ipcMain.handle('float-ball-drag-start', () => {
    if (floatMoveEvent) {
      floatMoveEvent.start();
    }
  });

  ipcMain.handle('float-ball-drag-end', () => {
    if (floatMoveEvent) {
      floatMoveEvent.end();
    }
  });

  ipcMain.handle('float-ball-copy-prompt', async (event, promptContent) => {
    // 复制到剪贴板的功能由前端实现，这里只是通知
    return { success: true };
  });

  floatBallHandlersRegistered = true;
}

export function getFloatBallWindow() {
  return floatBallWindow;
}
