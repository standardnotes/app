import { ContentType } from '@standardnotes/domain-core'
import {
  ConflictStrategy,
  DecryptedItem,
  DecryptedItemInterface,
  DecryptedPayloadInterface,
  HistoryEntryInterface,
  ItemsKeyContent,
  ItemsKeyInterface,
  ProtocolVersion,
} from '@standardnotes/models'

export function isItemsKey(x: unknown): x is ItemsKeyInterface {
  return (x as ItemsKeyInterface).content_type === ContentType.TYPES.ItemsKey
}

/**
 * A key used to encrypt other items. Items keys are synced and persisted.
 */
export class SNItemsKey extends DecryptedItem<ItemsKeyContent> implements ItemsKeyInterface {
  keyVersion: ProtocolVersion
  isDefault: boolean | undefined
  itemsKey: string

  constructor(payload: DecryptedPayloadInterface<ItemsKeyContent>) {
    super(payload)
    this.keyVersion = payload.content.version
    this.isDefault = payload.content.isDefault
    this.itemsKey = this.payload.content.itemsKey
  }

  /** Do not duplicate items keys. Always keep original */
  override strategyWhenConflictingWithItem(
    _item: DecryptedItemInterface,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    return ConflictStrategy.KeepBase
  }

  get dataAuthenticationKey(): string | undefined {
    if (this.keyVersion === ProtocolVersion.V004) {
      throw 'Attempting to access legacy data authentication key.'
    }
    return this.payload.content.dataAuthenticationKey
  }
}
