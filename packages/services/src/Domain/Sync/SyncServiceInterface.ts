/* istanbul ignore file */

import { DecryptedPayloadInterface, FullyFormedPayloadInterface } from '@standardnotes/models'
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
  getItemAndContentKey(uuid: string): Promise<{ payload: DecryptedPayloadInterface; contentKey: string } | undefined>
  syncGroupsFromScratch(groupUuids: string[]): Promise<void>
}
