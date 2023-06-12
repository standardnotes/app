import { ContactServiceInterface } from './../../Contacts/ContactServiceInterface'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import {
  KeySystemRootKeyInterface,
  KeySystemRootKeyMutator,
  AsymmetricMessageSharedVaultInvite,
} from '@standardnotes/models'
import { CreateKeySystemRootKeyUseCase } from '../../Vaults/UseCase/CreateKeySystemRootKey'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class HandleTrustedSharedVaultInviteMessage {
  constructor(
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private contacts: ContactServiceInterface,
  ) {}

  async execute(message: AsymmetricMessageSharedVaultInvite): Promise<'inserted' | 'changed'> {
    const { rootKey, trustedContacts } = message.data

    const existingKeySystemRootKey = this.items.getKeySystemRootKeyMatchingTimestamp(
      rootKey.systemIdentifier,
      rootKey.keyTimestamp,
    )

    if (existingKeySystemRootKey) {
      await this.items.changeItem<KeySystemRootKeyMutator, KeySystemRootKeyInterface>(
        existingKeySystemRootKey,
        (mutator) => {
          mutator.systemName = rootKey.systemName
          mutator.systemDescription = rootKey.systemDescription
        },
      )

      await this.sync.sync()

      return 'changed'
    }

    const createKeySystemRootKey = new CreateKeySystemRootKeyUseCase(this.items)
    await createKeySystemRootKey.execute(rootKey)

    for (const contact of trustedContacts) {
      await this.contacts.createOrEditTrustedContact({
        name: contact.name,
        contactUuid: contact.contactUuid,
        publicKey: contact.publicKey.encryption,
        signingPublicKey: contact.publicKey.signing,
      })
    }

    await this.sync.sync()
    return 'inserted'
  }
}
