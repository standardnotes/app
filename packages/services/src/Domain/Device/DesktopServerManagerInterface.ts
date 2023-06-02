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
  desktopServerChangeDataDirectory(): Promise<string | undefined>
  desktopServerGetDataDirectory(): Promise<string>
  desktopServerOpenDataDirectory(): Promise<void>
  desktopServerListenOnLogs(callback: (data: string) => void): void
  desktopServerStopListeningOnLogs(): void
}
