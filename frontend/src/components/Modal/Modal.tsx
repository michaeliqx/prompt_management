import React, { useEffect, useCallback } from 'react'
import './Modal.css'

export interface ModalOptions {
  title?: string
  message: string
  type?: 'alert' | 'confirm'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

interface ModalProps extends ModalOptions {
  visible: boolean
  onClose: () => void
}

const Modal: React.FC<ModalProps> = ({
  visible,
  title,
  message,
  type = 'alert',
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  onClose,
}) => {
  const handleConfirm = useCallback(() => {
    onConfirm?.()
    onClose()
  }, [onConfirm, onClose])

  const handleCancel = useCallback(() => {
    onCancel?.()
    onClose()
  }, [onCancel, onClose])

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [visible])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        if (type === 'confirm') {
          handleCancel()
        } else {
          handleConfirm()
        }
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [visible, type, handleCancel, handleConfirm])

  if (!visible) return null

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {title && <div className="modal-title">{title}</div>}
        <div className="modal-message">{message}</div>
        <div className="modal-actions">
          {type === 'confirm' && (
            <button className="modal-btn modal-btn-cancel" onClick={handleCancel}>
              {cancelText}
            </button>
          )}
          <button className="modal-btn modal-btn-confirm" onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal
