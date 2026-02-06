import React, { useState, useEffect } from 'react'
import './WindowControls.css'

const WindowControls: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    // 检查窗口是否最大化
    const checkMaximized = async () => {
      if (window.electronAPI?.windowIsMaximized) {
        const maximized = await window.electronAPI.windowIsMaximized()
        setIsMaximized(maximized)
      }
    }
    checkMaximized()

    // 监听窗口最大化/还原事件
    const handleMaximized = () => setIsMaximized(true)
    const handleUnmaximized = () => setIsMaximized(false)

    window.addEventListener('window-maximized', handleMaximized)
    window.addEventListener('window-unmaximized', handleUnmaximized)

    return () => {
      window.removeEventListener('window-maximized', handleMaximized)
      window.removeEventListener('window-unmaximized', handleUnmaximized)
    }
  }, [])

  const handleMinimize = () => {
    if (window.electronAPI?.windowMinimize) {
      window.electronAPI.windowMinimize()
    }
  }

  const handleMaximize = () => {
    if (window.electronAPI?.windowMaximize) {
      window.electronAPI.windowMaximize()
    }
  }

  const handleClose = () => {
    if (window.electronAPI?.windowClose) {
      window.electronAPI.windowClose()
    }
  }

  // 根据平台决定按钮顺序
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  return (
    <div className={`window-controls ${isMac ? 'mac' : 'windows'}`}>
      {isMac ? (
        <>
          <button className="window-control-btn close" onClick={handleClose} title="关闭" />
          <button className="window-control-btn minimize" onClick={handleMinimize} title="最小化" />
          <button className="window-control-btn maximize" onClick={handleMaximize} title={isMaximized ? "还原" : "最大化"} />
        </>
      ) : (
        <>
          <button className="window-control-btn minimize" onClick={handleMinimize} title="最小化">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M0 5.5h12v1H0z" fill="currentColor" />
            </svg>
          </button>
          <button className="window-control-btn maximize" onClick={handleMaximize} title={isMaximized ? "还原" : "最大化"}>
            {isMaximized ? (
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 2h8v8H2V2zm1 1v6h6V3H3z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 2h8v8H2V2z" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
            )}
          </button>
          <button className="window-control-btn close" onClick={handleClose} title="关闭">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}

export default WindowControls
