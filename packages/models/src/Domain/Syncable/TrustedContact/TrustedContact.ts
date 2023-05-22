import { ConflictStrategy, DecryptedItem, DecryptedItemInterface } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { TrustedContactContent } from './TrustedContactContent'
import { TrustedContactInterface } from './TrustedContactInterface'

export class TrustedContact extends DecryptedItem<TrustedContactContent> implements TrustedContactInterface {
  contactItemUuid: string
  userUuid: string
  publicKey: string
  name: string

  constructor(payload: DecryptedPayloadInterface<TrustedContactContent>) {
    super(payload)

    this.contactItemUuid = payload.content.contactItemUuid
    this.userUuid = payload.content.userUuid
    this.publicKey = payload.content.publicKey
    this.name = payload.content.name
  }

  override strategyWhenConflictingWithItem(
    _item: DecryptedItemInterface,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    return ConflictStrategy.KeepBase
  }
}
