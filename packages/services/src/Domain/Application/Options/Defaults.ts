import { ApplicationDisplayOptions, ApplicationSyncOptions } from './OptionalOptions'

export interface ApplicationOptionsWhichHaveDefaults {
  loadBatchSize: ApplicationSyncOptions['loadBatchSize']
  sleepBetweenBatches: ApplicationSyncOptions['sleepBetweenBatches']
  allowNoteSelectionStatePersistence: ApplicationDisplayOptions['allowNoteSelectionStatePersistence']
  allowMultipleSelection: ApplicationDisplayOptions['allowMultipleSelection']
}

export const ApplicationOptionsDefaults: ApplicationOptionsWhichHaveDefaults = {
  loadBatchSize: 700,
  sleepBetweenBatches: 10,
  allowMultipleSelection: true,
  allowNoteSelectionStatePersistence: true,
}
