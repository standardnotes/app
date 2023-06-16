import { ContentType, ProtocolVersion } from '@standardnotes/common'
import {
  ConflictStrategy,
  DecryptedItem,
  DecryptedItemInterface,
  DecryptedPayloadInterface,
  HistoryEntryInterface,
  KeySystemItemsKeyContent,
  KeySystemItemsKeyInterface,
} from '@standardnotes/models'

export function isKeySystemItemsKey(x: unknown): x is KeySystemItemsKeyInterface {
  return (x as KeySystemItemsKeyInterface).content_type === ContentType.KeySystemItemsKey
}

/**
 * A key used to encrypt other items. Items keys are synced and persisted.
 */
export class KeySystemItemsKey extends DecryptedItem<KeySystemItemsKeyContent> implements KeySystemItemsKeyInterface {
  keyTimestamp: number
  keyVersion: ProtocolVersion
  itemsKey: string
  rootKeyToken: string

  constructor(payload: DecryptedPayloadInterface<KeySystemItemsKeyContent>) {
    super(payload)

    this.keyTimestamp = payload.content.keyTimestamp
    this.keyVersion = payload.content.version
    this.itemsKey = this.payload.content.itemsKey
    this.rootKeyToken = this.payload.content.rootKeyToken
  }

  /** Do not duplicate vault items keys. Always keep original */
  override strategyWhenConflictingWithItem(
    _item: DecryptedItemInterface,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    return ConflictStrategy.KeepBase
  }
}
