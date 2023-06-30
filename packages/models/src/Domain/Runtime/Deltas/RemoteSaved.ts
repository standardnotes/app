import { ServerSyncSavedContextualPayload } from '../../Abstract/Contextual/ServerSyncSaved'
import { DeletedPayload } from './../../Abstract/Payload/Implementations/DeletedPayload'
import { ImmutablePayloadCollection } from '../Collection/Payload/ImmutablePayloadCollection'
import { PayloadSource } from '../../Abstract/Payload/Types/PayloadSource'
import { isDeletedPayload } from '../../Abstract/Payload/Interfaces/TypeCheck'
import { PayloadEmitSource } from '../../Abstract/Payload'
import { payloadByFinalizingSyncState } from './Utilities/ApplyDirtyState'
import { SyncDeltaEmit } from './Abstract/DeltaEmit'
import { SyncDeltaInterface } from './Abstract/SyncDeltaInterface'
import { BuildSyncResolvedParams, SyncResolvedPayload } from './Utilities/SyncResolvedPayload'
import { getIncrementedDirtyIndex } from '../DirtyCounter/DirtyCounter'

export class DeltaRemoteSaved implements SyncDeltaInterface {
  constructor(
    readonly baseCollection: ImmutablePayloadCollection,
    private readonly applyContextualPayloads: ServerSyncSavedContextualPayload[],
  ) {}

  public result(): SyncDeltaEmit {
    const processed: SyncResolvedPayload[] = []

    for (const apply of this.applyContextualPayloads) {
      const base = this.baseCollection.find(apply.uuid)

      if (!base) {
        const discarded = new DeletedPayload(
          {
            ...apply,
            deleted: true,
            content: undefined,
            ...BuildSyncResolvedParams({
              dirty: false,
              lastSyncEnd: new Date(),
            }),
          },
          PayloadSource.RemoteSaved,
        )

        processed.push(discarded as SyncResolvedPayload)
        continue
      }

      /**
       * If we save an item, but while in transit it is deleted locally, we want to keep
       * local deletion status, and not old (false) deleted value that was sent to server.
       */
      if (isDeletedPayload(base)) {
        const baseWasDeletedAfterThisRequest = !apply.deleted
        const regularDeletedPayload = apply.deleted
        if (baseWasDeletedAfterThisRequest) {
          const result = new DeletedPayload(
            {
              ...apply,
              deleted: true,
              content: undefined,
              dirtyIndex: getIncrementedDirtyIndex(),
              ...BuildSyncResolvedParams({
                dirty: true,
                lastSyncEnd: new Date(),
              }),
            },
            PayloadSource.RemoteSaved,
          )
          processed.push(result as SyncResolvedPayload)
        } else if (regularDeletedPayload) {
          const discarded = base.copy(
            {
              ...apply,
              deleted: true,
              ...BuildSyncResolvedParams({
                dirty: false,
                lastSyncEnd: new Date(),
              }),
            },
            PayloadSource.RemoteSaved,
          )
          processed.push(discarded as SyncResolvedPayload)
        }
      } else {
        const result = payloadByFinalizingSyncState(
          base.copy(
            {
              ...apply,
              deleted: false,
            },
            PayloadSource.RemoteSaved,
          ),
          this.baseCollection,
        )
        processed.push(result)
      }
    }

    return {
      emits: processed,
      source: PayloadEmitSource.RemoteSaved,
    }
  }
}
