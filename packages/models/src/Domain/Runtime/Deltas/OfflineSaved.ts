import { ImmutablePayloadCollection } from '../Collection/Payload/ImmutablePayloadCollection'
import { FullyFormedPayloadInterface, PayloadEmitSource } from '../../Abstract/Payload'
import { OfflineSyncSavedContextualPayload } from '../../Abstract/Contextual/OfflineSyncSaved'
import { payloadByFinalizingSyncState } from './Utilities/ApplyDirtyState'
import { SyncDeltaEmit } from './Abstract/DeltaEmit'
import { SyncDeltaInterface } from './Abstract/SyncDeltaInterface'
import { SyncResolvedPayload } from './Utilities/SyncResolvedPayload'

export class DeltaOfflineSaved implements SyncDeltaInterface {
  constructor(
    readonly baseCollection: ImmutablePayloadCollection<FullyFormedPayloadInterface>,
    readonly applyContextualPayloads: OfflineSyncSavedContextualPayload[],
  ) {}

  public result(): SyncDeltaEmit {
    const processed: SyncResolvedPayload[] = []

    for (const apply of this.applyContextualPayloads) {
      const base = this.baseCollection.find(apply.uuid)

      if (!base) {
        continue
      }

      processed.push(payloadByFinalizingSyncState(base, this.baseCollection))
    }

    return {
      emits: processed,
      source: PayloadEmitSource.OfflineSyncSaved,
    }
  }
}
