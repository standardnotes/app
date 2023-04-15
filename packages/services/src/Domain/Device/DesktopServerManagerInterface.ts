export type DesktopServerStatus = {
  status: 'on' | 'error' | 'off'
  url?: string
}

export interface DesktopServerManagerInterface {
  desktopServerStart(): Promise<void>
  desktopServerStop(): Promise<void>
  desktopServerRestart(): Promise<void>
  desktopServerStatus(): Promise<DesktopServerStatus>
  desktopServerInstall(): Promise<void>
  desktopServerChangeDataDirectory(): Promise<string | undefined>
  desktopServerGetDataDirectory(): Promise<string>
  desktopServerOpenDataDirectory(): Promise<void>
  desktopServerGetLogs(): Promise<string[]>
  desktopServerClearLogs(): Promise<void>
}
