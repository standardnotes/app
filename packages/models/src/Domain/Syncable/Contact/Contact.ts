import { ConflictStrategy, DecryptedItem, DecryptedItemInterface } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { ContactContent } from './ContactContent'
import { ContactInterface } from './ContactInterface'

export class Contact extends DecryptedItem<ContactContent> implements ContactInterface {
  readonly name: string
  readonly userUuid: string
  readonly publicKey: string

  constructor(payload: DecryptedPayloadInterface<ContactContent>) {
    super(payload)

    this.name = this.content.name
    this.userUuid = this.content.userUuid
    this.publicKey = this.content.publicKey
  }

  override strategyWhenConflictingWithItem(
    _item: DecryptedItemInterface,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    return ConflictStrategy.KeepBase
  }
}
