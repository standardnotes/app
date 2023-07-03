/* istanbul ignore file */

import { FullyFormedPayloadInterface } from '@standardnotes/models'
import { SyncOptions } from './SyncOptions'
import { AbstractService } from '../Service/AbstractService'
import { SyncEvent } from '../Event/SyncEvent'

export interface SyncServiceInterface extends AbstractService<SyncEvent> {
  sync(options?: Partial<SyncOptions>): Promise<unknown>
  resetSyncState(): void
  markAllItemsAsNeedingSyncAndPersist(): Promise<void>
  downloadFirstSync(waitTimeOnFailureMs: number, otherSyncOptions?: Partial<SyncOptions>): Promise<void>
  persistPayloads(payloads: FullyFormedPayloadInterface[]): Promise<void>
  lockSyncing(): void
  unlockSyncing(): void
  syncSharedVaultsFromScratch(sharedVaultUuids: string[]): Promise<void>
}
