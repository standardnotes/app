import { AppGroupManagedApplication, DeinitSource, DeinitMode } from '@standardnotes/services'

export type DeinitCallback = (application: AppGroupManagedApplication, mode: DeinitMode, source: DeinitSource) => void
