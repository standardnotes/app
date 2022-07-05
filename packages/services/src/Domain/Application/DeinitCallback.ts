import { DeinitSource } from './DeinitSource'
import { DeinitMode } from './DeinitMode'
import { AppGroupManagedApplication } from './ApplicationInterface'

export type DeinitCallback = (application: AppGroupManagedApplication, mode: DeinitMode, source: DeinitSource) => void
