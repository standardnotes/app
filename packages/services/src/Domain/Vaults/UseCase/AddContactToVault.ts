import { EncryptionProviderInterface } from '@standardnotes/encryption'
import {
  ClientDisplayableError,
  VaultInviteServerHash,
  VaultInviteType,
  VaultServerHash,
  VaultPermission,
} from '@standardnotes/responses'
import { TrustedContactInterface } from '@standardnotes/models'
import { VaultInvitesServerInterface } from '@standardnotes/api'
import { CreateVaultInviteUseCase } from './CreateVaultInvite'

export class AddContactToVaultUseCase {
  constructor(
    private encryption: EncryptionProviderInterface,
    private vaultInvitesServer: VaultInvitesServerInterface,
  ) {}

  async execute(params: {
    inviterPrivateKey: string
    inviterPublicKey: string
    vault: VaultServerHash
    contact: TrustedContactInterface
    permissions: VaultPermission
  }): Promise<VaultInviteServerHash | ClientDisplayableError> {
    const vaultKey = this.encryption.getVaultKey(params.vault.uuid)
    if (!vaultKey) {
      return ClientDisplayableError.FromString('Cannot add contact; vault key not found')
    }

    const encryptedVaultData = this.encryption.encryptVaultDataWithRecipientPublicKey(
      vaultKey.content,
      params.inviterPrivateKey,
      params.contact.publicKey,
    )

    const createInviteUseCase = new CreateVaultInviteUseCase(this.vaultInvitesServer)
    const createInviteResult = await createInviteUseCase.execute({
      vaultUuid: params.vault.uuid,
      inviteeUuid: params.contact.contactUuid,
      inviterPublicKey: params.inviterPublicKey,
      encryptedVaultData,
      inviteType: VaultInviteType.Join,
      permissions: params.permissions,
    })

    return createInviteResult
  }
}
