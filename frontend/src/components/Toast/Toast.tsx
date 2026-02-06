import React, { useState, useEffect } from 'react'
import './Toast.css'

interface ToastProps {
  message: string
  duration?: number
  onClose?: () => void
}

const Toast: React.FC<ToastProps> = ({ message, duration = 2000, onClose }) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        onClose?.()
      }, 300) // 等待动画完成
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!visible) return null

  return (
    <div className={`toast ${visible ? 'toast-visible' : ''}`}>
      {message}
    </div>
  )
}

export default Toast
