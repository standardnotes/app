import { ContactServiceInterface } from './../../Contacts/ContactServiceInterface'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import {
  KeySystemRootKeyInterface,
  KeySystemRootKeyMutator,
  AsymmetricMessageSharedVaultInvite,
  KeySystemRootKeyContent,
  FillItemContent,
} from '@standardnotes/models'

import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { ContentType } from '@standardnotes/common'

export class HandleTrustedSharedVaultInviteMessage {
  constructor(
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private contacts: ContactServiceInterface,
  ) {}

  async execute(message: AsymmetricMessageSharedVaultInvite): Promise<'inserted' | 'changed'> {
    const { rootKey: rootKeyContent, trustedContacts } = message.data

    const existingKeySystemRootKey = this.items.getKeySystemRootKeyWithKeyIdentifier(
      rootKeyContent.systemIdentifier,
      rootKeyContent.keyTimestamp,
    )

    if (existingKeySystemRootKey) {
      await this.items.changeItem<KeySystemRootKeyMutator, KeySystemRootKeyInterface>(
        existingKeySystemRootKey,
        (mutator) => {
          mutator.systemName = rootKeyContent.systemName
          mutator.systemDescription = rootKeyContent.systemDescription
        },
      )

      await this.sync.sync()

      return 'changed'
    }

    await this.items.createItem<KeySystemRootKeyInterface>(
      ContentType.KeySystemRootKey,
      FillItemContent<KeySystemRootKeyContent>(rootKeyContent),
      true,
    )

    for (const contact of trustedContacts) {
      await this.contacts.createOrEditTrustedContact({
        name: contact.name,
        contactUuid: contact.contactUuid,
        publicKey: contact.publicKeySet.encryption,
        signingPublicKey: contact.publicKeySet.signing,
      })
    }

    await this.sync.sync()
    return 'inserted'
  }
}
