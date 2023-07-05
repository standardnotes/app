import { IpcRendererEvent } from 'electron/renderer'

export type MainEventHandler = (event: IpcRendererEvent, value: unknown) => void

export interface ElectronMainEvents {
  setUpdateAvailableHandler(handler: MainEventHandler): void
  setWindowBlurredHandler(handler: MainEventHandler): void
  setWindowFocusedHandler(handler: MainEventHandler): void
  setInstallComponentCompleteHandler(handler: MainEventHandler): void
  setWatchedDirectoriesChangeHandler(handler: MainEventHandler): void
  setHomeServerStartedHandler(handler: MainEventHandler): void
  setConsoleLogHandler(handler: MainEventHandler): void
}
