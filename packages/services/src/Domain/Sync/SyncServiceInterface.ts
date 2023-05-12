/* istanbul ignore file */

import { DecryptedPayloadInterface, FullyFormedPayloadInterface } from '@standardnotes/models'
import { SyncOptions } from './SyncOptions'
import { AbstractService } from '../Service/AbstractService'

export interface SyncServiceInterface extends AbstractService {
  sync(options?: Partial<SyncOptions>): Promise<unknown>
  resetSyncState(): void
  markAllItemsAsNeedingSyncAndPersist(): Promise<void>
  downloadFirstSync(waitTimeOnFailureMs: number, otherSyncOptions?: Partial<SyncOptions>): Promise<void>
  persistPayloads(payloads: FullyFormedPayloadInterface[]): Promise<void>
  lockSyncing(): void
  unlockSyncing(): void
  getItemAndContentKey(uuid: string): Promise<{ payload: DecryptedPayloadInterface; contentKey: string } | undefined>
}
