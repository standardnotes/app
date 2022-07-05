import { PayloadSource } from '../../Abstract/Payload/Types/PayloadSource'
import { PayloadEmitSource } from '../../Abstract/Payload'
import { ImmutablePayloadCollection } from '../Collection/Payload/ImmutablePayloadCollection'
import { SyncDeltaEmit } from './Abstract/DeltaEmit'
import { SyncDeltaInterface } from './Abstract/SyncDeltaInterface'
import { SyncResolvedPayload } from './Utilities/SyncResolvedPayload'

export class DeltaRemoteRejected implements SyncDeltaInterface {
  constructor(
    readonly baseCollection: ImmutablePayloadCollection,
    readonly applyCollection: ImmutablePayloadCollection,
  ) {}

  public result(): SyncDeltaEmit {
    const results: SyncResolvedPayload[] = []

    for (const apply of this.applyCollection.all()) {
      const base = this.baseCollection.find(apply.uuid)

      if (!base) {
        continue
      }

      const result = base.copyAsSyncResolved(
        {
          dirty: false,
          lastSyncEnd: new Date(),
        },
        PayloadSource.RemoteSaved,
      )

      results.push(result)
    }

    return {
      emits: results,
      source: PayloadEmitSource.RemoteSaved,
    }
  }
}
