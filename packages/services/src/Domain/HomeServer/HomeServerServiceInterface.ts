import { HomeServerEnvironmentConfiguration } from './HomeServerEnvironmentConfiguration'

export interface HomeServerServiceInterface {
  isHomeServerEnabled(): boolean
  getHomeServerDataLocation(): string | undefined
  enableHomeServer(): Promise<void>
  disableHomeServer(): Promise<void>
  restartHomeServer(): Promise<void>
  changeHomeServerDataLocation(): Promise<string | undefined>
  openHomeServerDataLocation(): Promise<void>
  getHomeServerConfiguration(): HomeServerEnvironmentConfiguration | undefined
  setHomeServerConfiguration(config: HomeServerEnvironmentConfiguration): Promise<void>
  getLastServerErrorMessage(): string | undefined
}
