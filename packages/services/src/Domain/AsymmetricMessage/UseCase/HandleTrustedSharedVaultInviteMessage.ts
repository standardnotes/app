import { ContactServiceInterface } from './../../Contacts/ContactServiceInterface'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import {
  KeySystemRootKeyInterface,
  AsymmetricMessageSharedVaultInvite,
  KeySystemRootKeyContent,
  FillItemContent,
  FillItemContentSpecialized,
  VaultListingContentSpecialized,
  KeySystemRootKeyStorageMode,
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
  ): Promise<void> {
    const { rootKey: rootKeyContent, trustedContacts, metadata } = message.data

    const content: VaultListingContentSpecialized = {
      systemIdentifier: rootKeyContent.systemIdentifier,
      rootKeyParams: rootKeyContent.keyParams,
      keyStorageMode: KeySystemRootKeyStorageMode.Synced,
      name: metadata.name,
      description: metadata.description,
      sharing: {
        sharedVaultUuid: sharedVaultUuid,
        ownerUserUuid: senderUuid,
      },
    }

    await this.items.createItem<KeySystemRootKeyInterface>(
      ContentType.KeySystemRootKey,
      FillItemContent<KeySystemRootKeyContent>(rootKeyContent),
      true,
    )

    await this.items.createItem(ContentType.VaultListing, FillItemContentSpecialized(content), true)

    for (const contact of trustedContacts) {
      if (contact.isMe) {
        throw new Error('Should not receive isMe contact from invite')
      }

      await this.contacts.createOrEditTrustedContact({
        name: contact.name,
        contactUuid: contact.contactUuid,
        publicKey: contact.publicKeySet.encryption,
        signingPublicKey: contact.publicKeySet.signing,
      })
    }

    void this.sync.sync({ sourceDescription: 'Not awaiting due to this event handler running from sync response' })
  }
}
