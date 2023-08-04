import { ApplicationOptionsWhichHaveDefaults } from './Defaults'
import {
  ApplicationDisplayOptions,
  ApplicationOptionalConfiguratioOptions,
  ApplicationSyncOptions,
} from './OptionalOptions'
import { RequiredApplicationOptions } from './RequiredOptions'

export type ApplicationConstructorOptions = RequiredApplicationOptions &
  Partial<ApplicationSyncOptions & ApplicationDisplayOptions & ApplicationOptionalConfiguratioOptions>

export type FullyResolvedApplicationOptions = RequiredApplicationOptions &
  ApplicationSyncOptions &
  ApplicationDisplayOptions &
  ApplicationOptionalConfiguratioOptions &
  ApplicationOptionsWhichHaveDefaults
