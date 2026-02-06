import { app, BrowserWindow, screen, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const isDebug = isDev || process.env.ELECTRON_DEBUG === '1';

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

    // 拖动结束时，确保窗口位置正确，确保悬浮球完全可见
    const bounds = this.win.getBounds();
    const display = screen.getDisplayMatching(bounds);
    const { x: workAreaX, y: workAreaY, width: workAreaWidth, height: workAreaHeight } = display.workArea;
    
    const ballSize = 40;
    const ballTopInWindow = 300;
    const ballLeftInWindow = bounds.width / 2;
    
    let x = bounds.x;
    let y = bounds.y;
    let needAdjust = false;
    
    // 计算悬浮球在屏幕上的实际位置
    const ballLeft = x + ballLeftInWindow - ballSize / 2;
    const ballRight = x + ballLeftInWindow + ballSize / 2;
    const ballTop = y + ballTopInWindow;
    const ballBottom = y + ballTopInWindow + ballSize;
    
    // 限制窗口位置，确保悬浮球完全在工作区域内
    if (ballLeft < workAreaX) {
      x = workAreaX - ballLeftInWindow + ballSize / 2;
      needAdjust = true;
    }
    if (ballRight > workAreaX + workAreaWidth) {
      x = workAreaX + workAreaWidth - ballLeftInWindow - ballSize / 2;
      needAdjust = true;
    }
    if (ballTop < workAreaY) {
      y = workAreaY - ballTopInWindow;
      needAdjust = true;
    }
    if (ballBottom > workAreaY + workAreaHeight) {
      y = workAreaY + workAreaHeight - ballTopInWindow - ballSize;
      needAdjust = true;
    }
    
    if (needAdjust) {
      try {
        this.win.setPosition(Math.round(x), Math.round(y));
      } catch (error) {
        console.error('[悬浮球] 调整窗口位置失败:', error);
      }
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
  
  // 计算窗口位置，使悬浮球右边缘贴着屏幕右边
  let windowX = Math.floor(workAreaX + workAreaWidth - BALL_RIGHT_OFFSET);
  let windowY = Math.floor(workAreaY + (workAreaHeight - WINDOW_HEIGHT) / 2);
  
  // 确保窗口不会超出屏幕边界
  const ballLeft = windowX + BALL_CENTER_X_IN_WINDOW - BALL_SIZE / 2;
  const ballRight = windowX + BALL_CENTER_X_IN_WINDOW + BALL_SIZE / 2;
  const ballTop = windowY + BALL_TOP_IN_WINDOW;
  const ballBottom = windowY + BALL_TOP_IN_WINDOW + BALL_SIZE;
  
  // 调整窗口位置，确保悬浮球完全在工作区域内
  if (ballLeft < workAreaX) {
    windowX = workAreaX - BALL_CENTER_X_IN_WINDOW + BALL_SIZE / 2;
  }
  if (ballRight > workAreaX + workAreaWidth) {
    windowX = workAreaX + workAreaWidth - BALL_CENTER_X_IN_WINDOW - BALL_SIZE / 2;
  }
  if (ballTop < workAreaY) {
    windowY = workAreaY - BALL_TOP_IN_WINDOW;
  }
  if (ballBottom > workAreaY + workAreaHeight) {
    windowY = workAreaY + workAreaHeight - BALL_TOP_IN_WINDOW - BALL_SIZE;
  }
  
  // 确保窗口本身不超出屏幕
  windowX = Math.max(workAreaX, Math.min(windowX, workAreaX + workAreaWidth - WINDOW_WIDTH));
  windowY = Math.max(workAreaY, Math.min(windowY, workAreaY + workAreaHeight - WINDOW_HEIGHT));
  
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
    backgroundColor: '#00000000',
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
    floatBallWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
      console.error('[悬浮球] 加载失败:', code, desc, url);
    });
    floatBallWindow.webContents.on('did-finish-load', () => {
      if (isDebug) {
        floatBallWindow.webContents.openDevTools();
      }
    });
    floatBallWindow.loadURL('http://localhost:5173/float-ball.html');
  } else {
    floatBallWindow.webContents.on('did-finish-load', () => {
      if (isDebug) {
        floatBallWindow.webContents.openDevTools();
      }
    });
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

  // 主窗口已关闭仅悬浮球仍在时，点击悬浮球可重新创建并打开主窗口
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

  // 通知主窗口显示复制成功提示
  ipcMain.handle('float-ball-show-copy-success', (event, promptName) => {
    const window = ensureMainWindowExists();
    if (window && !window.isDestroyed()) {
      // 打开主窗口
      if (window.isMinimized()) {
        window.restore();
      }
      window.show();
      window.focus();
      
      // 延迟发送事件，确保主窗口已加载
      setTimeout(() => {
        if (window && !window.isDestroyed()) {
          window.webContents.executeJavaScript(`
            (function() {
              const event = new CustomEvent('prompt-copied', { detail: { promptName: '${promptName.replace(/'/g, "\\'")}' } });
              window.dispatchEvent(event);
            })();
          `).catch(err => {
            console.error('[悬浮球] 发送复制成功事件失败:', err);
          });
        }
      }, 500);
    }
  });

  floatBallHandlersRegistered = true;
}

export function getFloatBallWindow() {
  return floatBallWindow;
}
