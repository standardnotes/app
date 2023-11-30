import { Result } from '@standardnotes/domain-core'

import { HomeServerEnvironmentConfiguration } from './HomeServerEnvironmentConfiguration'
import { HomeServerStatus } from './HomeServerStatus'

export interface HomeServerServiceInterface {
  activatePremiumFeatures(username: string, subscriptionId: number): Promise<Result<string>>
  isHomeServerRunning(): Promise<boolean>
  isHomeServerEnabled(): Promise<boolean>
  getHomeServerDataLocation(): Promise<string | undefined>
  enableHomeServer(): Promise<void>
  disableHomeServer(): Promise<Result<string>>
  startHomeServer(): Promise<string | undefined>
  stopHomeServer(): Promise<string | undefined>
  changeHomeServerDataLocation(): Promise<Result<string>>
  openHomeServerDataLocation(): Promise<void>
  getHomeServerConfiguration(): Promise<HomeServerEnvironmentConfiguration | undefined>
  setHomeServerConfiguration(config: HomeServerEnvironmentConfiguration): Promise<void>
  getHomeServerUrl(): Promise<string | undefined>
  getHomeServerStatus(): Promise<HomeServerStatus>
  getHomeServerLogs(): Promise<string[]>
}
