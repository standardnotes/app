export interface HomeServerManagerInterface {
  startHomeServer(): Promise<string | undefined>
  setHomeServerConfiguration(configurationJSONString: string): Promise<void>
  getHomeServerConfiguration(): Promise<string | undefined>
  setHomeServerDataLocation(location: string): Promise<void>
  stopHomeServer(): Promise<string | undefined>
  activatePremiumFeatures(username: string, subscriptionId: number): Promise<string | undefined>
  getHomeServerLogs(): Promise<string[]>
  isHomeServerRunning(): Promise<boolean>
  getHomeServerUrl(): Promise<string | undefined>
  getHomeServerLastErrorMessage(): Promise<string | undefined>
}
