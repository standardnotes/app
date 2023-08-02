import { ImmutablePayloadCollection } from '../Collection/Payload/ImmutablePayloadCollection'
import { ConflictDelta } from './Conflict'
import { FullyFormedPayloadInterface, isDecryptedPayload, PayloadEmitSource } from '../../Abstract/Payload'
import { HistoryMap } from '../History'
import { extendSyncDelta, SourcelessSyncDeltaEmit, SyncDeltaEmit } from './Abstract/DeltaEmit'
import { DeltaInterface } from './Abstract/DeltaInterface'
import { SyncResolvedPayload } from './Utilities/SyncResolvedPayload'
import { getIncrementedDirtyIndex } from '../DirtyCounter/DirtyCounter'

export class DeltaFileImport implements DeltaInterface {
  constructor(
    readonly baseCollection: ImmutablePayloadCollection,
    private readonly applyPayloads: FullyFormedPayloadInterface[],
    protected readonly historyMap: HistoryMap,
  ) {}

  public result(): SyncDeltaEmit {
    const result: SyncDeltaEmit = {
      emits: [],
      ignored: [],
      source: PayloadEmitSource.FileImport,
    }

    for (const payload of this.applyPayloads) {
      const resolved = this.resolvePayload(payload, result)

      extendSyncDelta(result, resolved)
    }

    return result
  }

  private resolvePayload(payload: FullyFormedPayloadInterface, currentResults: SyncDeltaEmit): SourcelessSyncDeltaEmit {
    /**
     * Check to see if we've already processed a payload for this id.
     * If so, that would be the latest value, and not what's in the base collection.
     */

    /*
     * Find the most recently created conflict if available, as that
     * would contain the most recent value.
     */
    let current = currentResults.emits.find((candidate) => {
      return isDecryptedPayload(candidate) && candidate.content.conflict_of === payload.uuid
    })

    /**
     * If no latest conflict, find by uuid directly.
     */
    if (!current) {
      current = currentResults.emits.find((candidate) => {
        return candidate.uuid === payload.uuid
      })
    }

    /**
     * If not found in current results, use the base value.
     */
    if (!current) {
      const base = this.baseCollection.find(payload.uuid)
      if (base && isDecryptedPayload(base)) {
        current = base as SyncResolvedPayload
      }
    }

    /**
     * If the current doesn't exist, we're creating a new item from payload.
     */
    if (!current) {
      return {
        emits: [
          payload.copyAsSyncResolved({
            dirty: true,
            dirtyIndex: getIncrementedDirtyIndex(),
            lastSyncEnd: new Date(0),
          }),
        ],
        ignored: [],
      }
    }

    const delta = new ConflictDelta(this.baseCollection, current, payload, this.historyMap)

    return delta.result()
  }
}
