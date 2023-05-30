import { PayloadSource } from '../../Abstract/Payload/Types/PayloadSource'
import { FullyFormedPayloadInterface, PayloadEmitSource } from '../../Abstract/Payload'
import { ImmutablePayloadCollection } from '../Collection/Payload/ImmutablePayloadCollection'
import { SyncDeltaEmit } from './Abstract/DeltaEmit'
import { SyncDeltaInterface } from './Abstract/SyncDeltaInterface'
import { SyncResolvedPayload } from './Utilities/SyncResolvedPayload'
import {
  ConflictParams,
  ConflictParamsWithServerItem,
  ConflictParamsWithUnsavedItem,
  ConflictParamsWithServerAndUnsavedItem,
  conflictParamsHasServerItemAndUnsavedItem,
  conflictParamsHasOnlyServerItem,
  conflictParamsHasOnlyUnsavedItem,
} from '@standardnotes/responses'
import { PayloadsByDuplicating } from '../../Utilities/Payload/PayloadsByDuplicating'

export class DeltaRemoteRejected implements SyncDeltaInterface {
  constructor(
    readonly baseCollection: ImmutablePayloadCollection,
    readonly conflicts: ConflictParams<FullyFormedPayloadInterface>[],
  ) {}

  public result(): SyncDeltaEmit {
    const results: SyncResolvedPayload[] = []

    for (const conflict of this.conflicts) {
      if (conflictParamsHasServerItemAndUnsavedItem(conflict)) {
        results.push(...this.getResultForConflictWithServerItemAndUnsavedItem(conflict))
      } else if (conflictParamsHasOnlyServerItem(conflict)) {
        results.push(...this.getResultForConflictWithOnlyServerItem(conflict))
      } else if (conflictParamsHasOnlyUnsavedItem(conflict)) {
        results.push(...this.getResultForConflictWithOnlyUnsavedItem(conflict))
      }
    }

    return {
      emits: results,
      source: PayloadEmitSource.RemoteSaved,
    }
  }

  private getResultForConflictWithOnlyUnsavedItem(
    conflict: ConflictParamsWithUnsavedItem<FullyFormedPayloadInterface>,
  ): SyncResolvedPayload[] {
    const base = this.baseCollection.find(conflict.unsaved_item.uuid)
    if (!base) {
      return []
    }

    const result = base.copyAsSyncResolved(
      {
        dirty: false,
        lastSyncEnd: new Date(),
      },
      PayloadSource.RemoteSaved,
    )

    return [result]
  }

  private getResultForConflictWithOnlyServerItem(
    conflict: ConflictParamsWithServerItem<FullyFormedPayloadInterface>,
  ): SyncResolvedPayload[] {
    const base = this.baseCollection.find(conflict.server_item.uuid)
    if (!base) {
      return []
    }

    return this.resultByDuplicatingBasePayloadIntoNewUuidAndTakingServerPayloadAsCanonical(base, conflict.server_item)
  }

  private getResultForConflictWithServerItemAndUnsavedItem(
    conflict: ConflictParamsWithServerAndUnsavedItem<FullyFormedPayloadInterface>,
  ): SyncResolvedPayload[] {
    const base = this.baseCollection.find(conflict.server_item.uuid)
    if (!base) {
      return []
    }

    return this.resultByDuplicatingBasePayloadIntoNewUuidAndTakingServerPayloadAsCanonical(base, conflict.server_item)
  }

  private resultByDuplicatingBasePayloadIntoNewUuidAndTakingServerPayloadAsCanonical(
    basePayload: FullyFormedPayloadInterface,
    serverPayload: FullyFormedPayloadInterface,
  ): SyncResolvedPayload[] {
    const duplicateBasePayloadIntoNewUuid = PayloadsByDuplicating({
      payload: basePayload,
      baseCollection: this.baseCollection,
      isConflict: true,
      source: serverPayload.source,
    })

    const takeServerPayloadAsCanonical = serverPayload.copyAsSyncResolved(
      {
        lastSyncBegan: basePayload.lastSyncBegan,
        dirty: false,
        lastSyncEnd: new Date(),
      },
      serverPayload.source,
    )

    return duplicateBasePayloadIntoNewUuid.concat([takeServerPayloadAsCanonical])
  }
}
