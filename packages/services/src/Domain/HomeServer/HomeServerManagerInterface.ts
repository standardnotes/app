import { HomeServerStatus } from './HomeServerStatus'

export interface HomeServerManagerInterface {
  startServer(): Promise<void>
  setHomeServerConfiguration(configurationJSONString: string): Promise<void>
  stopServer(): Promise<void>
  restartServer(): Promise<void>
  serverStatus(): Promise<HomeServerStatus>
  listenOnServerLogs(callback: (data: Buffer) => void): void
  stopListeningOnServerLogs(): void
}
