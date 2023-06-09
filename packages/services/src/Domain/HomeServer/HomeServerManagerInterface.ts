import { HomeServerStatus } from './HomeServerStatus'

export interface HomeServerManagerInterface {
  startServer(): Promise<void>
  setHomeServerConfiguration(configurationJSONString: string): Promise<void>
  setHomeServerDataLocation(location: string): Promise<void>
  stopServer(): Promise<void>
  restartServer(): Promise<void>
  serverStatus(): Promise<HomeServerStatus>
  getLastServerErrorMessage(): string | undefined
  activatePremiumFeatures(username: string): Promise<string | null>
  getServerLogs(): Promise<string[]>
}
