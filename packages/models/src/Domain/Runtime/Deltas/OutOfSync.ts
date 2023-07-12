import { PayloadEmitSource } from '../../Abstract/Payload'
import { isDecryptedPayload } from '../../Abstract/Payload/Interfaces/TypeCheck'
import { PayloadContentsEqual } from '../../Utilities/Payload/PayloadContentsEqual'
import { ConflictDelta } from './Conflict'
import { ContentType } from '@standardnotes/domain-core'
import { ItemsKeyDelta } from './ItemsKeyDelta'
import { payloadByFinalizingSyncState } from './Utilities/ApplyDirtyState'
import { ImmutablePayloadCollection } from '../Collection/Payload/ImmutablePayloadCollection'
import { HistoryMap } from '../History'
import { extendSyncDelta, SyncDeltaEmit } from './Abstract/DeltaEmit'
import { SyncDeltaInterface } from './Abstract/SyncDeltaInterface'

export class DeltaOutOfSync implements SyncDeltaInterface {
  constructor(
    readonly baseCollection: ImmutablePayloadCollection,
    readonly applyCollection: ImmutablePayloadCollection,
    readonly historyMap: HistoryMap,
  ) {}

  public result(): SyncDeltaEmit {
    const result: SyncDeltaEmit = {
      emits: [],
      ignored: [],
      source: PayloadEmitSource.RemoteRetrieved,
    }

    for (const apply of this.applyCollection.all()) {
      if (apply.content_type === ContentType.TYPES.ItemsKey) {
        const itemsKeyDeltaEmit = new ItemsKeyDelta(this.baseCollection, [apply]).result()

        extendSyncDelta(result, itemsKeyDeltaEmit)

        continue
      }

      const base = this.baseCollection.find(apply.uuid)

      if (!base) {
        result.emits.push(payloadByFinalizingSyncState(apply, this.baseCollection))

        continue
      }

      const isBaseDecrypted = isDecryptedPayload(base)
      const isApplyDecrypted = isDecryptedPayload(apply)

      const needsConflict =
        isApplyDecrypted !== isBaseDecrypted ||
        (isApplyDecrypted && isBaseDecrypted && !PayloadContentsEqual(apply, base))

      if (needsConflict) {
        const delta = new ConflictDelta(this.baseCollection, base, apply, this.historyMap)

        extendSyncDelta(result, delta.result())
      } else {
        result.emits.push(payloadByFinalizingSyncState(apply, this.baseCollection))
      }
    }

    return result
  }
}
