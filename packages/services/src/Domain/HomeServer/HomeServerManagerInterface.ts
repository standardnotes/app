import { HomeServerStatus } from './HomeServerStatus'

export interface HomeServerManagerInterface {
  startHomeServer(): Promise<string | undefined>
  setHomeServerConfiguration(configurationJSONString: string): Promise<void>
  setHomeServerDataLocation(location: string): Promise<void>
  stopHomeServer(): Promise<void>
  homeServerStatus(): Promise<HomeServerStatus>
  activatePremiumFeatures(username: string): Promise<string | undefined>
  getHomeServerLogs(): Promise<string[]>
  isHomeServerRunning(): Promise<boolean>
}
