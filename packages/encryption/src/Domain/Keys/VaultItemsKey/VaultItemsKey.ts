import { ContentType, ProtocolVersion } from '@standardnotes/common'
import {
  ConflictStrategy,
  DecryptedItem,
  DecryptedItemInterface,
  DecryptedPayloadInterface,
  HistoryEntryInterface,
  VaultItemsKeyContent,
  VaultItemsKeyInterface,
} from '@standardnotes/models'

export function isVaultItemsKey(x: unknown): x is VaultItemsKeyInterface {
  return (x as VaultItemsKeyInterface).content_type === ContentType.VaultItemsKey
}

/**
 * A key used to encrypt other items. Items keys are synced and persisted.
 */
export class VaultItemsKey extends DecryptedItem<VaultItemsKeyContent> implements VaultItemsKeyInterface {
  keyVersion: ProtocolVersion
  itemsKey: string

  constructor(payload: DecryptedPayloadInterface<VaultItemsKeyContent>) {
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
