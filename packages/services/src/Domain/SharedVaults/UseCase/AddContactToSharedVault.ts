import { EncryptionProviderInterface } from '@standardnotes/encryption'
import {
  ClientDisplayableError,
  SharedVaultInviteServerHash,
  SharedVaultInviteType,
  SharedVaultPermission,
  SharedVaultServerHash,
} from '@standardnotes/responses'
import { TrustedContactInterface } from '@standardnotes/models'
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
    sharedVault: SharedVaultServerHash
    contact: TrustedContactInterface
    permissions: SharedVaultPermission
  }): Promise<SharedVaultInviteServerHash | ClientDisplayableError> {
    const vaultKeyCopy = this.items.getPrimarySyncedVaultKeyCopy(params.sharedVault.key_system_identifier)
    if (!vaultKeyCopy) {
      return ClientDisplayableError.FromString('Cannot add contact; vault key not found')
    }

    const encryptedVaultKeyContent = this.encryption.encryptVaultKeyContentWithRecipientPublicKey(
      vaultKeyCopy.content,
      params.inviterPrivateKey,
      params.contact.publicKey,
    )

    const createInviteUseCase = new CreateSharedVaultInviteUseCase(this.sharedVaultInviteServer)
    const createInviteResult = await createInviteUseCase.execute({
      sharedVaultUuid: params.sharedVault.uuid,
      inviteeUuid: params.contact.contactUuid,
      inviterPublicKey: params.inviterPublicKey,
      encryptedVaultKeyContent,
      inviteType: SharedVaultInviteType.Join,
      permissions: params.permissions,
    })

    return createInviteResult
  }
}
