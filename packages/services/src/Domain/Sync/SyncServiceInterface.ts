/* istanbul ignore file */

import { FullyFormedPayloadInterface } from '@standardnotes/models'
import { SyncOptions } from './SyncOptions'

export interface SyncServiceInterface {
  sync(options?: Partial<SyncOptions>): Promise<unknown>
  resetSyncState(): void
  markAllItemsAsNeedingSyncAndPersist(): Promise<void>
  downloadFirstSync(waitTimeOnFailureMs: number, otherSyncOptions?: Partial<SyncOptions>): Promise<void>
  persistPayloads(payloads: FullyFormedPayloadInterface[]): Promise<void>
  lockSyncing(): void
  unlockSyncing(): void
}
