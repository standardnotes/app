import { ImmutablePayloadCollection } from '../Collection/Payload/ImmutablePayloadCollection'
import {
  EncryptedPayloadInterface,
  FullyFormedPayloadInterface,
  isDecryptedPayload,
  isEncryptedPayload,
} from '../../Abstract/Payload'
import { SourcelessSyncDeltaEmit } from './Abstract/DeltaEmit'
import { SyncResolvedPayload } from './Utilities/SyncResolvedPayload'
import { payloadByFinalizingSyncState } from './Utilities/ApplyDirtyState'

export class ItemsKeyDelta {
  constructor(
    private baseCollection: ImmutablePayloadCollection,
    private readonly applyPayloads: FullyFormedPayloadInterface[],
  ) {}

  public result(): SourcelessSyncDeltaEmit {
    const emits: SyncResolvedPayload[] = []
    const ignored: EncryptedPayloadInterface[] = []

    for (const apply of this.applyPayloads) {
      const base = this.baseCollection.find(apply.uuid)

      if (!base) {
        emits.push(payloadByFinalizingSyncState(apply, this.baseCollection))

        continue
      }

      if (isEncryptedPayload(apply) && isDecryptedPayload(base)) {
        const keepBaseWithApplyTimestamps = base.copyAsSyncResolved({
          updated_at_timestamp: apply.updated_at_timestamp,
          updated_at: apply.updated_at,
          dirty: false,
          lastSyncEnd: new Date(),
        })

        emits.push(keepBaseWithApplyTimestamps)

        ignored.push(apply)
      } else {
        emits.push(payloadByFinalizingSyncState(apply, this.baseCollection))
      }
    }

    return {
      emits: emits,
      ignored,
    }
  }
}
