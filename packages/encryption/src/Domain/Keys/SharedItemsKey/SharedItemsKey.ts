import { ContentType, ProtocolVersion } from '@standardnotes/common'
import {
  ConflictStrategy,
  DecryptedItem,
  DecryptedItemInterface,
  DecryptedPayloadInterface,
  HistoryEntryInterface,
  SharedItemsKeyContent,
  SharedItemsKeyInterface,
} from '@standardnotes/models'

export function isSharedItemsKey(x: unknown): x is SharedItemsKeyInterface {
  return (x as SharedItemsKeyInterface).content_type === ContentType.SharedItemsKey
}

/**
 * A key used to encrypt other items. Items keys are synced and persisted.
 */
export class SharedItemsKey extends DecryptedItem<SharedItemsKeyContent> implements SharedItemsKeyInterface {
  keyVersion: ProtocolVersion
  itemsKey: string

  constructor(payload: DecryptedPayloadInterface<SharedItemsKeyContent>) {
    super(payload)
    this.keyVersion = payload.content.version
    this.itemsKey = this.payload.content.itemsKey
  }

  /** Do not duplicate items keys. Always keep original */
  override strategyWhenConflictingWithItem(
    _item: DecryptedItemInterface,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    return ConflictStrategy.KeepBase
  }
}
