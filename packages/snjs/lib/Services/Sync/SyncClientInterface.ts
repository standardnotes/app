import { SyncOpStatus } from './SyncOpStatus'
import { SyncOptions } from '@standardnotes/services'

export interface SyncClientInterface {
  setLaunchPriorityUuids(launchPriorityUuids: string[]): void

  sync(options?: Partial<SyncOptions>): Promise<unknown>

  isOutOfSync(): boolean

  getLastSyncDate(): Date | undefined

  getSyncStatus(): SyncOpStatus
}
