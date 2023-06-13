import { HomeServerStatus } from './HomeServerStatus'

export interface HomeServerManagerInterface {
  startHomeServer(): Promise<void>
  setHomeServerConfiguration(configurationJSONString: string): Promise<void>
  setHomeServerDataLocation(location: string): Promise<void>
  stopHomeServer(): Promise<void>
  restartHomeServer(): Promise<void>
  homeServerStatus(): Promise<HomeServerStatus>
  getLastHomeServerErrorMessage(): string | undefined
  activatePremiumFeatures(username: string): Promise<string | null>
  getHomeServerLogs(): Promise<string[]>
  isHomeServerRunning(): Promise<boolean>
}
