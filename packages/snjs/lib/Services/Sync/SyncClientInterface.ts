import { ServerSyncResponse } from './Account/Response'
import { OfflineSyncResponse } from './Offline/Response'
import { SyncOpStatus } from './SyncOpStatus'
import { AbstractService, SyncEvent, SyncOptions, SyncSource } from '@standardnotes/services'

export interface SyncClientInterface
  extends AbstractService<SyncEvent, ServerSyncResponse | OfflineSyncResponse | { source: SyncSource }> {
  setLaunchPriorityUuids(launchPriorityUuids: string[]): void

  sync(options?: Partial<SyncOptions>): Promise<unknown>

  isOutOfSync(): boolean

  getLastSyncDate(): Date | undefined

  getSyncStatus(): SyncOpStatus
}
