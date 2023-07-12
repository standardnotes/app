import { ImmutablePayloadCollection } from './../Collection/Payload/ImmutablePayloadCollection'
import { ConflictDelta } from './Conflict'
import { isErrorDecryptingPayload, isDecryptedPayload } from '../../Abstract/Payload/Interfaces/TypeCheck'
import { FullyFormedPayloadInterface, PayloadEmitSource } from '../../Abstract/Payload'
import { ContentType } from '@standardnotes/domain-core'
import { HistoryMap } from '../History'
import { ServerSyncPushContextualPayload } from '../../Abstract/Contextual/ServerSyncPush'
import { payloadByFinalizingSyncState } from './Utilities/ApplyDirtyState'
import { ItemsKeyDelta } from './ItemsKeyDelta'
import { extendSyncDelta, SyncDeltaEmit } from './Abstract/DeltaEmit'
import { SyncDeltaInterface } from './Abstract/SyncDeltaInterface'

export class DeltaRemoteRetrieved implements SyncDeltaInterface {
  constructor(
    readonly baseCollection: ImmutablePayloadCollection,
    readonly applyCollection: ImmutablePayloadCollection,
    private itemsSavedOrSaving: ServerSyncPushContextualPayload[],
    readonly historyMap: HistoryMap,
  ) {}

  private isUuidOfPayloadCurrentlySavingOrSaved(uuid: string): boolean {
    return this.itemsSavedOrSaving.find((i) => i.uuid === uuid) != undefined
  }

  public result(): SyncDeltaEmit {
    const result: SyncDeltaEmit = {
      emits: [],
      ignored: [],
      source: PayloadEmitSource.RemoteRetrieved,
    }

    const conflicted: FullyFormedPayloadInterface[] = []

    /**
     * If we have retrieved an item that was saved as part of this ongoing sync operation,
     * or if the item is locally dirty, filter it out of retrieved_items, and add to potential conflicts.
     */
    for (const apply of this.applyCollection.all()) {
      if (
        apply.content_type === ContentType.TYPES.ItemsKey ||
        apply.content_type === ContentType.TYPES.KeySystemItemsKey
      ) {
        const itemsKeyDeltaEmit = new ItemsKeyDelta(this.baseCollection, [apply]).result()

        extendSyncDelta(result, itemsKeyDeltaEmit)

        continue
      }

      const isSavedOrSaving = this.isUuidOfPayloadCurrentlySavingOrSaved(apply.uuid)

      if (isSavedOrSaving) {
        conflicted.push(apply)

        continue
      }

      const base = this.baseCollection.find(apply.uuid)
      if (base?.dirty && !isErrorDecryptingPayload(base)) {
        conflicted.push(apply)

        continue
      }

      result.emits.push(payloadByFinalizingSyncState(apply, this.baseCollection))
    }

    /**
     * For any potential conflict above, we compare the values with current
     * local values, and if they differ, we create a new payload that is a copy
     * of the server payload.
     */
    for (const conflict of conflicted) {
      if (!isDecryptedPayload(conflict)) {
        continue
      }

      const base = this.baseCollection.find(conflict.uuid)
      if (!base) {
        continue
      }

      const delta = new ConflictDelta(this.baseCollection, base, conflict, this.historyMap)

      extendSyncDelta(result, delta.result())
    }

    return result
  }
}
