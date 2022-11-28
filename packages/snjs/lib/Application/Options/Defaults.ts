import { ApplicationSyncOptions } from './OptionalOptions'

export interface ApplicationOptionsWhichHaveDefaults {
  loadBatchSize: ApplicationSyncOptions['loadBatchSize']
}

export const ApplicationOptionsDefaults: ApplicationOptionsWhichHaveDefaults = {
  loadBatchSize: 700,
}
