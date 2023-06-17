import { ContactServiceInterface } from './../../Contacts/ContactServiceInterface'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import {
  KeySystemRootKeyInterface,
  AsymmetricMessageSharedVaultInvite,
  KeySystemRootKeyContent,
  FillItemContent,
  FillItemContentSpecialized,
  VaultListingContentSpecialized,
  KeySystemRootKeyStorageType,
} from '@standardnotes/models'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { ContentType } from '@standardnotes/common'

export class HandleTrustedSharedVaultInviteMessage {
  constructor(
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private contacts: ContactServiceInterface,
  ) {}

  async execute(
    message: AsymmetricMessageSharedVaultInvite,
    sharedVaultUuid: string,
    senderUuid: string,
  ): Promise<'inserted' | 'changed'> {
    const { rootKey: rootKeyContent, trustedContacts, metadata } = message.data

    const content: VaultListingContentSpecialized = {
      systemIdentifier: rootKeyContent.systemIdentifier,
      rootKeyPasswordType: rootKeyContent.keyParams.passwordType,
      rootKeyParams: rootKeyContent.keyParams,
      rootKeyStorage: KeySystemRootKeyStorageType.Synced,
      name: metadata.name,
      description: metadata.description,
      sharing: {
        sharedVaultUuid: sharedVaultUuid,
        ownerUserUuid: senderUuid,
      },
    }

    await this.items.createItem(ContentType.VaultListing, FillItemContentSpecialized(content), true)

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
