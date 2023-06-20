import { HomeServerStatus } from './HomeServerStatus'

export interface HomeServerManagerInterface {
  startHomeServer(): Promise<string | undefined>
  setHomeServerConfiguration(configurationJSONString: string): Promise<void>
  getHomeServerConfiguration(): Promise<string | undefined>
  setHomeServerDataLocation(location: string): Promise<void>
  stopHomeServer(): Promise<string | undefined>
  homeServerStatus(): Promise<HomeServerStatus>
  activatePremiumFeatures(username: string): Promise<string | undefined>
  getHomeServerLogs(): Promise<string[]>
  isHomeServerRunning(): Promise<boolean>
  getHomeServerUrl(): Promise<string | undefined>
}
