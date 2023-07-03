import { HomeServerEnvironmentConfiguration } from '@standardnotes/snjs'

export interface HomeServerConfigurationFile {
  version: '1.0.0'
  info: Record<string, string>
  configuration: HomeServerEnvironmentConfiguration
}
