const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 悬浮球相关
  floatBallGetPosition: () => ipcRenderer.invoke('float-ball-get-position'),
  floatBallSetSize: (width, height) => ipcRenderer.invoke('float-ball-set-size', width, height),
  floatBallSetIgnoreMouseEvents: (ignore, options) => ipcRenderer.invoke('float-ball-set-ignore-mouse-events', ignore, options),
  floatBallDragStart: () => ipcRenderer.invoke('float-ball-drag-start'),
  floatBallDragEnd: () => ipcRenderer.invoke('float-ball-drag-end'),
  floatBallClose: () => ipcRenderer.invoke('float-ball-close'),
  floatBallOpenMain: () => ipcRenderer.invoke('float-ball-open-main'),
  floatBallNavigate: (route) => ipcRenderer.invoke('float-ball-navigate', route),
  floatBallShowCopySuccess: (promptName) => ipcRenderer.invoke('float-ball-show-copy-success', promptName),
  // 窗口控制相关
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
})
