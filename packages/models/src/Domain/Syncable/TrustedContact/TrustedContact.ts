import { ConflictStrategy, DecryptedItem, DecryptedItemInterface } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { TrustedContactContent } from './TrustedContactContent'
import { TrustedContactInterface } from './TrustedContactInterface'

export class TrustedContact extends DecryptedItem<TrustedContactContent> implements TrustedContactInterface {
  serverUuid: string
  contactUuid: string
  publicKey: string
  name: string

  constructor(payload: DecryptedPayloadInterface<TrustedContactContent>) {
    super(payload)

    this.serverUuid = payload.content.serverUuid
    this.contactUuid = payload.content.contactUuid
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
