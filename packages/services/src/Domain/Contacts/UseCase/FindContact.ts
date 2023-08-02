import { Predicate, TrustedContactInterface } from '@standardnotes/models'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { FindContactQuery } from './Types/FindContactQuery'
import { ContentType, Result, SyncUseCaseInterface } from '@standardnotes/domain-core'

export class FindContact implements SyncUseCaseInterface<TrustedContactInterface> {
  constructor(private items: ItemManagerInterface) {}

  execute(query: FindContactQuery): Result<TrustedContactInterface> {
    if ('userUuid' in query && query.userUuid) {
      const contacts = this.items.itemsMatchingPredicate<TrustedContactInterface>(
        ContentType.TYPES.TrustedContact,
        new Predicate<TrustedContactInterface>('contactUuid', '=', query.userUuid),
      )

      if (contacts.length === 0) {
        return Result.fail(`Contact not found for user ${query.userUuid}`)
      }

      if (contacts.length > 1) {
        return Result.fail(`Multiple contacts found for user ${query.userUuid}`)
      }

      return Result.ok(contacts[0])
    }

    if ('signingPublicKey' in query && query.signingPublicKey) {
      const allContacts = this.items.getItems<TrustedContactInterface>(ContentType.TYPES.TrustedContact)
      const contact = allContacts.find((contact) =>
        contact.hasCurrentOrPreviousSigningPublicKey(query.signingPublicKey),
      )

      if (contact) {
        return Result.ok(contact)
      } else {
        return Result.fail('Contact not found')
      }
    }

    throw new Error('Invalid query')
  }
}
