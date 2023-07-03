import { SyncOpStatus } from './SyncOpStatus'
import { AbstractService, SyncEvent, SyncOptions } from '@standardnotes/services'

export interface SyncClientInterface extends AbstractService<SyncEvent> {
  setLaunchPriorityUuids(launchPriorityUuids: string[]): void
  sync(options?: Partial<SyncOptions>): Promise<unknown>
  isOutOfSync(): boolean
  getLastSyncDate(): Date | undefined
  getSyncStatus(): SyncOpStatus
  lockSyncing(): void
  unlockSyncing(): void

  completedOnlineDownloadFirstSync: boolean
}
