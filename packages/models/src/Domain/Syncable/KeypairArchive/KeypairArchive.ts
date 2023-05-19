import { ConflictStrategy, DecryptedItem, DecryptedItemInterface } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { KeypairArchiveContent } from './KeypairArchiveContent'
import { KeypairArchiveInterface } from './KeypairArchiveInterface'

export class KeypairArchive extends DecryptedItem<KeypairArchiveContent> implements KeypairArchiveInterface {
  readonly publicKey: string
  readonly privateKey: string

  constructor(payload: DecryptedPayloadInterface<KeypairArchiveContent>) {
    super(payload)

    this.publicKey = payload.content.publicKey
    this.privateKey = payload.content.privateKey
  }

  override strategyWhenConflictingWithItem(
    _item: DecryptedItemInterface,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    return ConflictStrategy.KeepBase
  }
}
