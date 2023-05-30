import { ConflictDelta } from './Conflict'
import { FullyFormedPayloadInterface, PayloadEmitSource } from '../../Abstract/Payload'
import { ImmutablePayloadCollection } from '../Collection/Payload/ImmutablePayloadCollection'
import { HistoryMap } from '../History'
import { extendSyncDelta, SyncDeltaEmit } from './Abstract/DeltaEmit'
import { SyncDeltaInterface } from './Abstract/SyncDeltaInterface'
import { payloadByFinalizingSyncState } from './Utilities/ApplyDirtyState'
import { ConflictConflictingDataParams } from '@standardnotes/responses'

export class DeltaRemoteDataConflicts implements SyncDeltaInterface {
  constructor(
    readonly baseCollection: ImmutablePayloadCollection,
    readonly conflicts: ConflictConflictingDataParams<FullyFormedPayloadInterface>[],
    readonly historyMap: HistoryMap,
  ) {}

  public result(): SyncDeltaEmit {
    const result: SyncDeltaEmit = {
      emits: [],
      ignored: [],
      source: PayloadEmitSource.RemoteRetrieved,
    }

    for (const conflict of this.conflicts) {
      const base = this.baseCollection.find(conflict.server_item.uuid)

      const isBaseDeleted = base == undefined

      if (isBaseDeleted) {
        result.emits.push(payloadByFinalizingSyncState(conflict.server_item, this.baseCollection))

        continue
      }

      const delta = new ConflictDelta(this.baseCollection, base, conflict.server_item, this.historyMap)

      extendSyncDelta(result, delta.result())
    }

    return result
  }
}
