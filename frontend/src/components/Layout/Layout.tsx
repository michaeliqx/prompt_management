import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import WindowControls from '../WindowControls/WindowControls'
import Toast from '../Toast/Toast'
import { Modal, modalManager, ModalOptions } from '../Modal'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [modalOptions, setModalOptions] = useState<ModalOptions | null>(null)

  useEffect(() => {
    const handlePromptCopied = (event: CustomEvent) => {
      const promptName = event.detail?.promptName || 'Prompt'
      setToastMessage(`已复制：${promptName}`)
    }

    window.addEventListener('prompt-copied', handlePromptCopied as EventListener)

    // 注册Modal管理器
    modalManager.register((options) => {
      setModalOptions(options)
    })

    return () => {
      window.removeEventListener('prompt-copied', handlePromptCopied as EventListener)
      modalManager.unregister()
    }
  }, [])

  const handleModalClose = () => {
    setModalOptions(null)
  }

  return (
    <div className="layout">
      <WindowControls />
      <Sidebar />
      <main className="layout-main">
        {children}
      </main>
      {toastMessage && (
        <Toast
          message={toastMessage}
          duration={2000}
          onClose={() => setToastMessage(null)}
        />
      )}
      {modalOptions && (
        <Modal
          {...modalOptions}
          visible={true}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}

export default Layout
