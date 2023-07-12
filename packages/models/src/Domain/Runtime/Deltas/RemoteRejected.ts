import { PayloadSource } from '../../Abstract/Payload/Types/PayloadSource'
import { DeletedPayload, FullyFormedPayloadInterface, PayloadEmitSource } from '../../Abstract/Payload'
import { ImmutablePayloadCollection } from '../Collection/Payload/ImmutablePayloadCollection'
import { SyncDeltaEmit } from './Abstract/DeltaEmit'
import { SyncDeltaInterface } from './Abstract/SyncDeltaInterface'
import { BuildSyncResolvedParams, SyncResolvedPayload } from './Utilities/SyncResolvedPayload'
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
import { ContentType } from '@standardnotes/domain-core'

export class DeltaRemoteRejected implements SyncDeltaInterface {
  constructor(
    readonly baseCollection: ImmutablePayloadCollection,
    readonly conflicts: ConflictParams<FullyFormedPayloadInterface>[],
  ) {}

  public result(): SyncDeltaEmit {
    const results: SyncResolvedPayload[] = []

    const vaultErrors: ConflictType[] = [
      ConflictType.SharedVaultInsufficientPermissionsError,
      ConflictType.SharedVaultNotMemberError,
      ConflictType.SharedVaultInvalidState,
      ConflictType.SharedVaultSnjsVersionError,
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

    if (conflict.type === ConflictType.SharedVaultNotMemberError) {
      return this.resultByDuplicatingBasePayloadAsNonVaultedAndRemovingBaseItemLocally(base)
    }

    if (base.content_type === ContentType.TYPES.KeySystemItemsKey) {
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
        key_system_identifier: undefined,
        shared_vault_uuid: undefined,
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
        key_system_identifier: undefined,
        shared_vault_uuid: undefined,
      }),
      baseCollection: this.baseCollection,
      isConflict: true,
      source: basePayload.source,
    })

    return [...duplicateBasePayloadWithoutVault, ...this.discardChangesOfBasePayload(basePayload)]
  }

  private resultByDuplicatingBasePayloadAsNonVaultedAndRemovingBaseItemLocally(
    basePayload: FullyFormedPayloadInterface,
  ): SyncResolvedPayload[] {
    const duplicateBasePayloadWithoutVault = PayloadsByDuplicating({
      payload: basePayload.copy({
        key_system_identifier: undefined,
        shared_vault_uuid: undefined,
      }),
      baseCollection: this.baseCollection,
      isConflict: true,
      source: basePayload.source,
    })

    const locallyDeletedBasePayload = new DeletedPayload(
      {
        ...basePayload,
        content: undefined,
        deleted: true,
        key_system_identifier: undefined,
        shared_vault_uuid: undefined,
        ...BuildSyncResolvedParams({
          dirty: false,
          lastSyncEnd: new Date(),
        }),
      },
      PayloadSource.RemoteSaved,
    )

    return [...duplicateBasePayloadWithoutVault, locallyDeletedBasePayload as SyncResolvedPayload]
  }
}
