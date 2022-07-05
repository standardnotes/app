import { ConflictDelta } from './Conflict'
import { PayloadEmitSource } from '../../Abstract/Payload'
import { ImmutablePayloadCollection } from '../Collection/Payload/ImmutablePayloadCollection'
import { HistoryMap } from '../History'
import { extendSyncDelta, SyncDeltaEmit } from './Abstract/DeltaEmit'
import { SyncDeltaInterface } from './Abstract/SyncDeltaInterface'
import { payloadByFinalizingSyncState } from './Utilities/ApplyDirtyState'

export class DeltaRemoteDataConflicts implements SyncDeltaInterface {
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
      const base = this.baseCollection.find(apply.uuid)

      const isBaseDeleted = base == undefined

      if (isBaseDeleted) {
        result.emits.push(payloadByFinalizingSyncState(apply, this.baseCollection))

        continue
      }

      const delta = new ConflictDelta(this.baseCollection, base, apply, this.historyMap)

      extendSyncDelta(result, delta.result())
    }

    return result
  }
}
