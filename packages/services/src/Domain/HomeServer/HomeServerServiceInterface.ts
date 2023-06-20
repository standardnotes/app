import { Result } from '@standardnotes/domain-core'

import { HomeServerEnvironmentConfiguration } from './HomeServerEnvironmentConfiguration'

export interface HomeServerServiceInterface {
  activatePremiumFeatures(username: string): Promise<Result<string>>
  isHomeServerRunning(): Promise<boolean>
  isHomeServerEnabled(): boolean
  getHomeServerDataLocation(): string | undefined
  enableHomeServer(): Promise<void>
  disableHomeServer(): Promise<Result<string>>
  startHomeServer(): Promise<string | undefined>
  stopHomeServer(): Promise<string | undefined>
  changeHomeServerDataLocation(): Promise<Result<string>>
  openHomeServerDataLocation(): Promise<void>
  getHomeServerConfiguration(): Promise<HomeServerEnvironmentConfiguration | undefined>
  setHomeServerConfiguration(config: HomeServerEnvironmentConfiguration): Promise<void>
  getHomeServerUrl(): Promise<string | undefined>
}
