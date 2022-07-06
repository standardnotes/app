import { ApplicationDisplayOptions, ApplicationSyncOptions } from './OptionalOptions'

export interface ApplicationOptionsWhichHaveDefaults {
  loadBatchSize: ApplicationSyncOptions['loadBatchSize']
  supportsFileNavigation: ApplicationDisplayOptions['supportsFileNavigation']
}

export const ApplicationOptionsDefaults: ApplicationOptionsWhichHaveDefaults = {
  loadBatchSize: 700,
  supportsFileNavigation: false,
}
