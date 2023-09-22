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
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'
import { ContentType } from '@standardnotes/domain-core'
import { CreateOrEditContact } from '../../Contacts/UseCase/CreateOrEditContact'

export class ProcessAcceptedVaultInvite {
  constructor(
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private _createOrEditContact: CreateOrEditContact,
  ) {}

  async execute(
    message: AsymmetricMessageSharedVaultInvite,
    sharedVaultUuid: string,
    ownerUuid: string,
  ): Promise<void> {
    const { rootKey: rootKeyContent, trustedContacts, metadata } = message.data

    const content: VaultListingContentSpecialized = {
      systemIdentifier: rootKeyContent.systemIdentifier,
      rootKeyParams: rootKeyContent.keyParams,
      keyStorageMode: KeySystemRootKeyStorageMode.Synced,
      name: metadata.name,
      description: metadata.description,
      iconString: metadata.iconString,
      sharing: {
        sharedVaultUuid: sharedVaultUuid,
        ownerUserUuid: ownerUuid,
        fileBytesUsed: metadata.fileBytesUsed,
        designatedSurvivor: metadata.designatedSurvivor,
      },
    }

    await this.mutator.createItem<KeySystemRootKeyInterface>(
      ContentType.TYPES.KeySystemRootKey,
      FillItemContent<KeySystemRootKeyContent>(rootKeyContent),
      true,
    )

    await this.mutator.createItem(ContentType.TYPES.VaultListing, FillItemContentSpecialized(content), true)

    for (const contact of trustedContacts) {
      await this._createOrEditContact.execute({
        name: contact.name,
        contactUuid: contact.contactUuid,
        publicKey: contact.publicKeySet.encryption,
        signingPublicKey: contact.publicKeySet.signing,
      })
    }

    void this.sync.sync({ sourceDescription: 'Not awaiting due to this event handler running from sync response' })
  }
}
