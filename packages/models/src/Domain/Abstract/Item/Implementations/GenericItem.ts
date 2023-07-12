import { dateToLocalizedString, deepFreeze } from '@standardnotes/utils'
import { TransferPayload } from './../../TransferPayload/Interfaces/TransferPayload'
import { ItemContentsDiffer } from '../../../Utilities/Item/ItemContentsDiffer'
import { ItemInterface } from '../Interfaces/ItemInterface'
import { PayloadSource } from '../../Payload/Types/PayloadSource'
import { ConflictStrategy } from '../Types/ConflictStrategy'
import { PredicateInterface } from '../../../Runtime/Predicate/Interface'
import { SingletonStrategy } from '../Types/SingletonStrategy'
import { PayloadInterface } from '../../Payload/Interfaces/PayloadInterface'
import { HistoryEntryInterface } from '../../../Runtime/History/HistoryEntryInterface'
import { isDecryptedItem, isDeletedItem, isEncryptedErroredItem } from '../Interfaces/TypeCheck'
import { PersistentSignatureData } from '../../../Runtime/Encryption/PersistentSignatureData'

export abstract class GenericItem<P extends PayloadInterface = PayloadInterface> implements ItemInterface<P> {
  payload: P
  public readonly duplicateOf?: string
  public readonly createdAtString?: string
  public updatedAtString?: string
  public userModifiedDate: Date

  constructor(payload: P) {
    this.payload = payload
    this.duplicateOf = payload.duplicate_of
    this.createdAtString = this.created_at && dateToLocalizedString(this.created_at)
    this.userModifiedDate = this.serverUpdatedAt || new Date()
    this.updatedAtString = dateToLocalizedString(this.userModifiedDate)

    const timeToAllowSubclassesToFinishConstruction = 0
    setTimeout(() => {
      deepFreeze(this)
    }, timeToAllowSubclassesToFinishConstruction)
  }

  get uuid() {
    return this.payload.uuid
  }

  get content_type(): string {
    return this.payload.content_type
  }

  get created_at() {
    return this.payload.created_at
  }

  get key_system_identifier(): string | undefined {
    return this.payload.key_system_identifier
  }

  get user_uuid(): string | undefined {
    return this.payload.user_uuid
  }

  get shared_vault_uuid(): string | undefined {
    return this.payload.shared_vault_uuid
  }

  get last_edited_by_uuid(): string | undefined {
    return this.payload.last_edited_by_uuid
  }

  get signatureData(): PersistentSignatureData | undefined {
    return this.payload.signatureData
  }

  /**
   * The date timestamp the server set for this item upon it being synced
   * Undefined if never synced to a remote server.
   */
  public get serverUpdatedAt(): Date {
    return this.payload.serverUpdatedAt
  }

  public get serverUpdatedAtTimestamp(): number | undefined {
    return this.payload.updated_at_timestamp
  }

  /** @deprecated Use serverUpdatedAt instead */
  public get updated_at(): Date | undefined {
    return this.serverUpdatedAt
  }

  get dirty() {
    return this.payload.dirty
  }

  get lastSyncBegan() {
    return this.payload.lastSyncBegan
  }

  get lastSyncEnd() {
    return this.payload.lastSyncEnd
  }

  get duplicate_of() {
    return this.payload.duplicate_of
  }

  public payloadRepresentation(override?: Partial<TransferPayload>): P {
    return this.payload.copy(override)
  }

  /** Whether the item has never been synced to a server */
  public get neverSynced(): boolean {
    return !this.serverUpdatedAt || this.serverUpdatedAt.getTime() === 0
  }

  /**
   * Subclasses can override this getter to return true if they want only
   * one of this item to exist, depending on custom criteria.
   */
  public get isSingleton(): boolean {
    return false
  }

  /** The predicate by which singleton items should be unique */
  public singletonPredicate<T extends ItemInterface>(): PredicateInterface<T> {
    throw 'Must override SNItem.singletonPredicate'
  }

  public get singletonStrategy(): SingletonStrategy {
    return SingletonStrategy.KeepEarliest
  }

  /**
   * Subclasses can override this method and provide their own opinion on whether
   * they want to be duplicated. For example, if this.content.x = 12 and
   * item.content.x = 13, this function can be overriden to always return
   * ConflictStrategy.KeepBase to say 'don't create a duplicate at all, the
   * change is not important.'
   *
   * In the default implementation, we create a duplicate if content differs.
   * However, if they only differ by references, we KEEP_LEFT_MERGE_REFS.
   *
   * Left returns to our current item, and Right refers to the incoming item.
   */
  public strategyWhenConflictingWithItem(
    item: ItemInterface,
    previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    if (isEncryptedErroredItem(this)) {
      return ConflictStrategy.KeepBaseDuplicateApply
    }

    if (this.isSingleton) {
      return ConflictStrategy.KeepBase
    }

    if (isDeletedItem(this)) {
      return ConflictStrategy.KeepApply
    }

    if (isDeletedItem(item)) {
      if (this.payload.source === PayloadSource.FileImport) {
        return ConflictStrategy.KeepBase
      }
      return ConflictStrategy.KeepApply
    }

    if (!isDecryptedItem(item) || !isDecryptedItem(this)) {
      return ConflictStrategy.KeepBaseDuplicateApply
    }

    const contentDiffers = ItemContentsDiffer(this, item)
    if (!contentDiffers) {
      return ConflictStrategy.KeepApply
    }

    const itemsAreDifferentExcludingRefs = ItemContentsDiffer(this, item, ['references'])
    if (itemsAreDifferentExcludingRefs) {
      if (previousRevision) {
        /**
         * If previousRevision.content === incomingValue.content, this means the
         * change that was rejected by the server is in fact a legitimate change,
         * because the value the client had previously matched with the server's,
         * and this new change is being built on top of that state, and should therefore
         * be chosen as the winner, with no need for a conflict.
         */
        if (!ItemContentsDiffer(previousRevision.itemFromPayload(), item)) {
          return ConflictStrategy.KeepBase
        }
      }
      const twentySeconds = 20_000
      if (
        /**
         * If the incoming item comes from an import, treat it as
         * less important than the existing one.
         */
        item.payload.source === PayloadSource.FileImport ||
        /**
         * If the user is actively editing our item, duplicate the incoming item
         * to avoid creating surprises in the client's UI.
         */
        Date.now() - this.userModifiedDate.getTime() < twentySeconds
      ) {
        return ConflictStrategy.KeepBaseDuplicateApply
      } else {
        return ConflictStrategy.DuplicateBaseKeepApply
      }
    } else {
      /** Only the references have changed; merge them. */
      return ConflictStrategy.KeepBaseMergeRefs
    }
  }

  public satisfiesPredicate(predicate: PredicateInterface<ItemInterface>): boolean {
    return predicate.matchesItem(this)
  }
}
