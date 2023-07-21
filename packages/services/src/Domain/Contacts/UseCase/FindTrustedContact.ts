import { Predicate, TrustedContactInterface } from '@standardnotes/models'
import { ItemManagerInterface } from './../../Item/ItemManagerInterface'
import { FindContactQuery } from './FindContactQuery'
import { ContentType } from '@standardnotes/domain-core'

export class FindTrustedContactUseCase {
  constructor(private items: ItemManagerInterface) {}

  execute(query: FindContactQuery): TrustedContactInterface | undefined {
    if ('userUuid' in query && query.userUuid) {
      return this.items.itemsMatchingPredicate<TrustedContactInterface>(
        ContentType.TYPES.TrustedContact,
        new Predicate<TrustedContactInterface>('contactUuid', '=', query.userUuid),
      )[0]
    }

    if ('signingPublicKey' in query && query.signingPublicKey) {
      const allContacts = this.items.getItems<TrustedContactInterface>(ContentType.TYPES.TrustedContact)
      return allContacts.find((contact) => contact.hasCurrentOrPreviousSigningPublicKey(query.signingPublicKey))
    }

    throw new Error('Invalid query')
  }
}
