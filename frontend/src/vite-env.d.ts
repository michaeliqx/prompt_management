/// <reference types="vite/client" />

declare global {
  interface Window {
    electronAPI?: {
      windowMinimize?: () => Promise<void>
      windowMaximize?: () => Promise<void>
      windowClose?: () => Promise<void>
      windowIsMaximized?: () => Promise<boolean>
      floatBallGetPosition?: () => Promise<{ x: number; y: number } | null>
      floatBallSetSize?: (width: number, height: number) => Promise<void>
      floatBallSetIgnoreMouseEvents?: (ignore: boolean, options?: { forward?: boolean }) => Promise<void>
      floatBallDragStart?: () => Promise<void>
      floatBallDragEnd?: () => Promise<void>
      floatBallClose?: () => Promise<void>
      floatBallOpenMain?: () => Promise<void>
      floatBallShowCopySuccess?: (promptName: string) => Promise<void>
    }
  }
}

export {}
