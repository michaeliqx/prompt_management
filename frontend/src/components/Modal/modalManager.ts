import { ModalOptions } from './Modal'

type ModalCallback = (options: ModalOptions) => void

class ModalManager {
  private showModal: ModalCallback | null = null

  register(callback: ModalCallback) {
    this.showModal = callback
  }

  unregister() {
    this.showModal = null
  }

  alert(message: string, title?: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.showModal) {
        console.error('Modal manager not initialized')
        resolve()
        return
      }
      this.showModal({
        message,
        title,
        type: 'alert',
        onConfirm: () => {
          resolve()
        },
      })
    })
  }

  confirm(message: string, title?: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.showModal) {
        console.error('Modal manager not initialized')
        resolve(false)
        return
      }
      this.showModal({
        message,
        title,
        type: 'confirm',
        onConfirm: () => {
          resolve(true)
        },
        onCancel: () => {
          resolve(false)
        },
      })
    })
  }
}

export const modalManager = new ModalManager()
