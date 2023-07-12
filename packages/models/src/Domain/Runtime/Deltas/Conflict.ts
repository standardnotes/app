import { uniqCombineObjArrays } from '@standardnotes/utils'
import { ContentType } from '@standardnotes/domain-core'
import { ImmutablePayloadCollection } from '../Collection/Payload/ImmutablePayloadCollection'
import { CreateDecryptedItemFromPayload, CreateItemFromPayload } from '../../Utilities/Item/ItemGenerator'
import { HistoryMap, historyMapFunctions } from '../History/HistoryMap'
import { ConflictStrategy } from '../../Abstract/Item/Types/ConflictStrategy'
import { PayloadsByDuplicating } from '../../Utilities/Payload/PayloadsByDuplicating'
import { PayloadContentsEqual } from '../../Utilities/Payload/PayloadContentsEqual'
import { FullyFormedPayloadInterface } from '../../Abstract/Payload'
import {
  isDecryptedPayload,
  isErrorDecryptingPayload,
  isDeletedPayload,
} from '../../Abstract/Payload/Interfaces/TypeCheck'
import { SyncResolvedPayload } from './Utilities/SyncResolvedPayload'
import { ItemsKeyDelta } from './ItemsKeyDelta'
import { SourcelessSyncDeltaEmit } from './Abstract/DeltaEmit'
import { getIncrementedDirtyIndex } from '../DirtyCounter/DirtyCounter'

export class ConflictDelta {
  constructor(
    protected readonly baseCollection: ImmutablePayloadCollection,
    protected readonly basePayload: FullyFormedPayloadInterface,
    protected readonly applyPayload: FullyFormedPayloadInterface,
    protected readonly historyMap: HistoryMap,
  ) {}

  public result(): SourcelessSyncDeltaEmit {
    if (this.applyPayload.content_type === ContentType.TYPES.ItemsKey) {
      const keyDelta = new ItemsKeyDelta(this.baseCollection, [this.applyPayload])

      return keyDelta.result()
    }

    const strategy = this.getConflictStrategy()

    return {
      emits: this.handleStrategy(strategy),
      ignored: [],
    }
  }

  getConflictStrategy(): ConflictStrategy {
    const isBaseErrored = isErrorDecryptingPayload(this.basePayload)
    const isApplyErrored = isErrorDecryptingPayload(this.applyPayload)
    if (isBaseErrored || isApplyErrored) {
      if (isBaseErrored && !isApplyErrored) {
        return ConflictStrategy.KeepBaseDuplicateApply
      } else if (!isBaseErrored && isApplyErrored) {
        return ConflictStrategy.DuplicateBaseKeepApply
      } else if (isBaseErrored && isApplyErrored) {
        return ConflictStrategy.KeepApply
      }
    } else if (isDecryptedPayload(this.basePayload)) {
      /**
       * Ensure no conflict has already been created with the incoming content.
       * This can occur in a multi-page sync request where in the middle of the request,
       * we make changes to many items, including duplicating, but since we are still not
       * uploading the changes until after the multi-page request completes, we may have
       * already conflicted this item.
       */
      const existingConflict = this.baseCollection.conflictsOf(this.applyPayload.uuid)[0]
      if (
        existingConflict &&
        isDecryptedPayload(existingConflict) &&
        isDecryptedPayload(this.applyPayload) &&
        PayloadContentsEqual(existingConflict, this.applyPayload)
      ) {
        /** Conflict exists and its contents are the same as incoming value, do not make duplicate */
        return ConflictStrategy.KeepBase
      } else {
        const tmpBaseItem = CreateDecryptedItemFromPayload(this.basePayload)
        const tmpApplyItem = CreateItemFromPayload(this.applyPayload)
        const historyEntries = this.historyMap[this.basePayload.uuid] || []
        const previousRevision = historyMapFunctions.getNewestRevision(historyEntries)

        return tmpBaseItem.strategyWhenConflictingWithItem(tmpApplyItem, previousRevision)
      }
    } else if (isDeletedPayload(this.basePayload) || isDeletedPayload(this.applyPayload)) {
      const baseDeleted = isDeletedPayload(this.basePayload)
      const applyDeleted = isDeletedPayload(this.applyPayload)
      if (baseDeleted && applyDeleted) {
        return ConflictStrategy.KeepApply
      } else {
        return ConflictStrategy.KeepApply
      }
    }

    throw Error('Unhandled strategy in Conflict Delta getConflictStrategy')
  }

  private handleStrategy(strategy: ConflictStrategy): SyncResolvedPayload[] {
    if (strategy === ConflictStrategy.KeepBase) {
      return this.handleKeepBaseStrategy()
    }

    if (strategy === ConflictStrategy.KeepApply) {
      return this.handleKeepApplyStrategy()
    }

    if (strategy === ConflictStrategy.KeepBaseDuplicateApply) {
      return this.handleKeepBaseDuplicateApplyStrategy()
    }

    if (strategy === ConflictStrategy.DuplicateBaseKeepApply) {
      return this.handleDuplicateBaseKeepApply()
    }

    if (strategy === ConflictStrategy.KeepBaseMergeRefs) {
      return this.handleKeepBaseMergeRefsStrategy()
    }

    throw Error('Unhandled strategy in conflict delta payloadsByHandlingStrategy')
  }

  private handleKeepBaseStrategy(): SyncResolvedPayload[] {
    const updatedAt = this.applyPayload.serverUpdatedAt

    const updatedAtTimestamp = this.applyPayload.updated_at_timestamp

    const leftPayload = this.basePayload.copyAsSyncResolved(
      {
        updated_at: updatedAt,
        updated_at_timestamp: updatedAtTimestamp,
        dirtyIndex: getIncrementedDirtyIndex(),
        dirty: true,
        lastSyncEnd: new Date(),
      },
      this.applyPayload.source,
    )

    return [leftPayload]
  }

  private handleKeepApplyStrategy(): SyncResolvedPayload[] {
    const result = this.applyPayload.copyAsSyncResolved(
      {
        lastSyncBegan: this.basePayload.lastSyncBegan,
        lastSyncEnd: new Date(),
        dirty: false,
      },
      this.applyPayload.source,
    )

    return [result]
  }

  private handleKeepBaseDuplicateApplyStrategy(): SyncResolvedPayload[] {
    const updatedAt = this.applyPayload.serverUpdatedAt

    const updatedAtTimestamp = this.applyPayload.updated_at_timestamp

    const leftPayload = this.basePayload.copyAsSyncResolved(
      {
        updated_at: updatedAt,
        updated_at_timestamp: updatedAtTimestamp,
        dirty: true,
        dirtyIndex: getIncrementedDirtyIndex(),
        lastSyncEnd: new Date(),
      },
      this.applyPayload.source,
    )

    const rightPayloads = PayloadsByDuplicating({
      payload: this.applyPayload,
      baseCollection: this.baseCollection,
      isConflict: true,
      source: this.applyPayload.source,
    })

    return [leftPayload].concat(rightPayloads)
  }

  private handleDuplicateBaseKeepApply(): SyncResolvedPayload[] {
    const leftPayloads = PayloadsByDuplicating({
      payload: this.basePayload,
      baseCollection: this.baseCollection,
      isConflict: true,
      source: this.applyPayload.source,
    })

    const rightPayload = this.applyPayload.copyAsSyncResolved(
      {
        lastSyncBegan: this.basePayload.lastSyncBegan,
        dirty: false,
        lastSyncEnd: new Date(),
      },
      this.applyPayload.source,
    )

    return leftPayloads.concat([rightPayload])
  }

  private handleKeepBaseMergeRefsStrategy(): SyncResolvedPayload[] {
    if (!isDecryptedPayload(this.basePayload) || !isDecryptedPayload(this.applyPayload)) {
      return []
    }

    const refs = uniqCombineObjArrays(this.basePayload.content.references, this.applyPayload.content.references, [
      'uuid',
      'content_type',
    ])

    const updatedAt = this.applyPayload.serverUpdatedAt

    const updatedAtTimestamp = this.applyPayload.updated_at_timestamp

    const payload = this.basePayload.copyAsSyncResolved(
      {
        updated_at: updatedAt,
        updated_at_timestamp: updatedAtTimestamp,
        dirty: true,
        dirtyIndex: getIncrementedDirtyIndex(),
        lastSyncEnd: new Date(),
        content: {
          ...this.basePayload.content,
          references: refs,
        },
      },
      this.applyPayload.source,
    )

    return [payload]
  }
}
