import { SyncOpStatus } from './SyncOpStatus'
import { SyncOptions } from '@standardnotes/services'

export interface SyncClientInterface {
  sync(options?: Partial<SyncOptions>): Promise<unknown>

  isOutOfSync(): boolean

  getLastSyncDate(): Date | undefined

  getSyncStatus(): SyncOpStatus
}
