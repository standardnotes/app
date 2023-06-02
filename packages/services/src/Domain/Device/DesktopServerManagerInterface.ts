export type DesktopServerStatus = {
  status: 'on' | 'error' | 'off'
  url?: string
  message?: string
}

export interface DesktopServerManagerInterface {
  desktopServerStart(): Promise<void>
  desktopServerStop(): Promise<void>
  desktopServerRestart(): Promise<void>
  desktopServerStatus(): Promise<DesktopServerStatus>
  desktopServerListenOnLogs(callback: (data: Buffer) => void): void
  desktopServerStopListeningOnLogs(): void
}
