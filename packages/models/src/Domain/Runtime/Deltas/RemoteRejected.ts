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
  ConflictType,
} from '@standardnotes/responses'
import { PayloadsByDuplicating } from '../../Utilities/Payload/PayloadsByDuplicating'
import { ContentType } from '@standardnotes/common'

export class DeltaRemoteRejected implements SyncDeltaInterface {
  constructor(
    readonly baseCollection: ImmutablePayloadCollection,
    readonly conflicts: ConflictParams<FullyFormedPayloadInterface>[],
  ) {}

  public result(): SyncDeltaEmit {
    const results: SyncResolvedPayload[] = []

    const vaultErrors: ConflictType[] = [
      ConflictType.GroupInsufficientPermissionsError,
      ConflictType.GroupNotMemberError,
      ConflictType.GroupInvalidItemsKey,
    ]

    for (const conflict of this.conflicts) {
      if (vaultErrors.includes(conflict.type)) {
        results.push(...this.handleVaultError(conflict))
      } else if (conflictParamsHasServerItemAndUnsavedItem(conflict)) {
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

  private handleVaultError(conflict: ConflictParams<FullyFormedPayloadInterface>): SyncResolvedPayload[] {
    const base = this.baseCollection.find(conflict.unsaved_item.uuid)
    if (!base) {
      return []
    }

    if (base.content_type === ContentType.VaultItemsKey) {
      return this.discardChangesOfBasePayload(base)
    }

    if (conflict.server_item) {
      return this.resultByDuplicatingBasePayloadAsNonVaultedAndTakingServerPayloadAsCanonical(
        base,
        conflict.server_item,
      )
    } else {
      return this.resultByDuplicatingBasePayloadAsNonVaultedAndDiscardingChangesOfOriginal(base)
    }
  }

  private discardChangesOfBasePayload(base: FullyFormedPayloadInterface): SyncResolvedPayload[] {
    const undirtiedPayload = base.copyAsSyncResolved(
      {
        dirty: false,
        lastSyncEnd: new Date(),
      },
      PayloadSource.RemoteSaved,
    )

    return [undirtiedPayload]
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

  private resultByDuplicatingBasePayloadAsNonVaultedAndTakingServerPayloadAsCanonical(
    basePayload: FullyFormedPayloadInterface,
    serverPayload: FullyFormedPayloadInterface,
  ): SyncResolvedPayload[] {
    const duplicateBasePayloadIntoNewUuid = PayloadsByDuplicating({
      payload: basePayload.copy({
        vault_system_identifier: undefined,
      }),
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

  private resultByDuplicatingBasePayloadAsNonVaultedAndDiscardingChangesOfOriginal(
    basePayload: FullyFormedPayloadInterface,
  ): SyncResolvedPayload[] {
    const duplicateBasePayloadWithoutVault = PayloadsByDuplicating({
      payload: basePayload.copy({
        vault_system_identifier: undefined,
      }),
      baseCollection: this.baseCollection,
      isConflict: true,
      source: basePayload.source,
    })

    return [...duplicateBasePayloadWithoutVault, ...this.discardChangesOfBasePayload(basePayload)]
  }
}
