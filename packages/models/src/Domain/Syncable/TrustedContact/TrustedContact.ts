import { ConflictStrategy, DecryptedItem, DecryptedItemInterface } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { TrustedContactContent } from './TrustedContactContent'
import { TrustedContactInterface } from './TrustedContactInterface'

export class TrustedContact extends DecryptedItem<TrustedContactContent> implements TrustedContactInterface {
  contactItemUuid: string
  contactUserUuid: string
  contactPublicKey: string

  constructor(payload: DecryptedPayloadInterface<TrustedContactContent>) {
    super(payload)

    this.contactItemUuid = payload.content.contactItemUuid
    this.contactUserUuid = payload.content.contactUserUuid
    this.contactPublicKey = payload.content.contactPublicKey
  }

  override strategyWhenConflictingWithItem(
    _item: DecryptedItemInterface,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    return ConflictStrategy.KeepBase
  }
}
