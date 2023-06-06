import { EncryptionProviderInterface } from '@standardnotes/encryption'
import {
  ClientDisplayableError,
  SharedVaultInviteServerHash,
  SharedVaultInviteType,
  SharedVaultPermission,
} from '@standardnotes/responses'
import { TrustedContactInterface, SharedVaultDisplayListing } from '@standardnotes/models'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { CreateSharedVaultInviteUseCase } from './CreateSharedVaultInvite'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class AddContactToSharedVaultUseCase {
  constructor(
    private encryption: EncryptionProviderInterface,
    private sharedVaultInviteServer: SharedVaultInvitesServerInterface,
    private items: ItemManagerInterface,
  ) {}

  async execute(params: {
    inviterPrivateKey: string
    inviterPublicKey: string
    sharedVault: SharedVaultDisplayListing
    contact: TrustedContactInterface
    permissions: SharedVaultPermission
  }): Promise<SharedVaultInviteServerHash | ClientDisplayableError> {
    const keySystemRootKey = this.items.getPrimaryKeySystemRootKey(params.sharedVault.systemIdentifier)
    if (!keySystemRootKey) {
      return ClientDisplayableError.FromString('Cannot add contact; key system root key not found')
    }

    const encryptedKeySystemRootKeyContent = this.encryption.asymmetricallyEncryptSharedVaultMessage(
      keySystemRootKey.content,
      params.inviterPrivateKey,
      params.contact.publicKey,
    )

    const createInviteUseCase = new CreateSharedVaultInviteUseCase(this.sharedVaultInviteServer)
    const createInviteResult = await createInviteUseCase.execute({
      sharedVaultUuid: params.sharedVault.sharedVaultUuid,
      inviteeUuid: params.contact.contactUuid,
      inviterPublicKey: params.inviterPublicKey,
      encryptedKeySystemRootKeyContent,
      inviteType: SharedVaultInviteType.Join,
      permissions: params.permissions,
    })

    return createInviteResult
  }
}
