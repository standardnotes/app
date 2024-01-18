/* istanbul ignore file */

import { DecryptedItemInterface, DeletedItemInterface, FullyFormedPayloadInterface } from '@standardnotes/models'
import { SyncOptions } from './SyncOptions'
import { AbstractService } from '../Service/AbstractService'
import { SyncEvent } from '../Event/SyncEvent'
import { SyncOpStatus } from './SyncOpStatus'
import { HttpRequest } from '@standardnotes/responses'

export interface SyncServiceInterface extends AbstractService<SyncEvent> {
  sync(options?: Partial<SyncOptions>): Promise<unknown>
  getRawSyncRequestForExternalUse(
    items: (DecryptedItemInterface | DeletedItemInterface)[],
  ): Promise<HttpRequest | undefined>

  isDatabaseLoaded(): boolean
  onNewDatabaseCreated(): Promise<void>
  loadDatabasePayloads(): Promise<void>
  beginAutoSyncTimer(): void
  resetSyncState(): void
  markAllItemsAsNeedingSyncAndPersist(): Promise<void>
  downloadFirstSync(waitTimeOnFailureMs: number, otherSyncOptions?: Partial<SyncOptions>): Promise<void>
  persistPayloads(payloads: FullyFormedPayloadInterface[]): Promise<void>
  lockSyncing(): void
  unlockSyncing(): void
  syncSharedVaultsFromScratch(sharedVaultUuids: string[]): Promise<void>

  setLaunchPriorityUuids(launchPriorityUuids: string[]): void

  isOutOfSync(): boolean
  getLastSyncDate(): Date | undefined
  getSyncStatus(): SyncOpStatus

  completedOnlineDownloadFirstSync: boolean
}
