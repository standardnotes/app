import { VaultKeyContentSpecialized, VaultKeyInterface, VaultKeyMutator } from '@standardnotes/models'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import {
  ClientDisplayableError,
  VaultInviteType,
  isClientDisplayableError,
  isErrorResponse,
} from '@standardnotes/responses'
import { VaultInvitesServerInterface, VaultUsersServerInterface } from '@standardnotes/api'
import { GetVaultUsersUseCase } from './GetVaultUsers'
import { CreateVaultInviteUseCase } from './CreateVaultInvite'
import { UpdateVaultInviteUseCase } from './UpdateVaultInvite'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'

export class ChangeVaultKeyDataUseCase {
  constructor(
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private vaultInvitesServer: VaultInvitesServerInterface,
    private vaultUsersServer: VaultUsersServerInterface,
    private contacts: ContactServiceInterface,
  ) {}

  async execute(params: {
    vaultUuid: string
    newVaultData: VaultKeyContentSpecialized
    inviterUuid: string
    inviterPrivateKey: string
    inviterPublicKey: string
  }): Promise<ClientDisplayableError[]> {
    const vaultKey = this.encryption.getVaultKey(params.vaultUuid)
    if (!vaultKey) {
      throw new Error(`Vault key not found for vault ${params.vaultUuid}`)
    }

    const updatedVaultKey = await this.items.changeItem<VaultKeyMutator, VaultKeyInterface>(vaultKey, (mutator) => {
      mutator.content = params.newVaultData
    })

    const errors: ClientDisplayableError[] = []

    const reuploadErrors = await this.reuploadExistingInvites({
      vaultData: updatedVaultKey.content,
      vaultUuid: params.vaultUuid,
      inviterUuid: params.inviterUuid,
      inviterPrivateKey: params.inviterPrivateKey,
      inviterPublicKey: params.inviterPublicKey,
    })
    errors.push(...reuploadErrors)

    const inviteErrors = await this.sendKeyChangeInviteToAcceptedVaultMembers({
      vaultData: updatedVaultKey.content,
      vaultUuid: params.vaultUuid,
      inviterUuid: params.inviterUuid,
      inviterPrivateKey: params.inviterPrivateKey,
      inviterPublicKey: params.inviterPublicKey,
    })
    errors.push(...inviteErrors)

    return errors
  }

  private async reuploadExistingInvites(params: {
    vaultData: VaultKeyContentSpecialized
    vaultUuid: string
    inviterUuid: string
    inviterPrivateKey: string
    inviterPublicKey: string
  }): Promise<ClientDisplayableError[]> {
    const response = await this.vaultInvitesServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return [ClientDisplayableError.FromString(`Failed to get outbound user invites ${response}`)]
    }

    const invites = response.data.invites

    const existingVaultInvites = invites.filter((invite) => invite.vault_uuid === params.vaultUuid)

    const errors: ClientDisplayableError[] = []

    for (const invite of existingVaultInvites) {
      const encryptedVaultData = this.getEncryptedVaultDataForRecipient({
        vaultData: params.vaultData,
        inviterPrivateKey: params.inviterPrivateKey,
        recipientUuid: invite.user_uuid,
      })

      if (!encryptedVaultData) {
        errors.push(ClientDisplayableError.FromString(`Failed to encrypt vault key for user ${invite.user_uuid}`))
        continue
      }

      const updateInviteUseCase = new UpdateVaultInviteUseCase(this.vaultInvitesServer)
      const updateInviteResult = await updateInviteUseCase.execute({
        vaultUuid: params.vaultUuid,
        inviteUuid: invite.uuid,
        inviterPublicKey: params.inviterPublicKey,
        encryptedVaultData,
        inviteType: invite.invite_type,
        permissions: invite.permissions,
      })

      if (isClientDisplayableError(updateInviteResult)) {
        errors.push(updateInviteResult)
      }
    }

    return errors
  }

  private async sendKeyChangeInviteToAcceptedVaultMembers(params: {
    vaultData: VaultKeyContentSpecialized
    vaultUuid: string
    inviterUuid: string
    inviterPrivateKey: string
    inviterPublicKey: string
  }): Promise<ClientDisplayableError[]> {
    const getUsersUseCase = new GetVaultUsersUseCase(this.vaultUsersServer)
    const users = await getUsersUseCase.execute({ vaultUuid: params.vaultUuid })
    if (!users) {
      return [ClientDisplayableError.FromString('Cannot rotate vault key; users not found')]
    }
    if (users.length === 0) {
      return []
    }

    const errors: ClientDisplayableError[] = []

    for (const user of users) {
      if (user.user_uuid === params.inviterUuid) {
        continue
      }

      const encryptedVaultData = this.getEncryptedVaultDataForRecipient({
        vaultData: params.vaultData,
        inviterPrivateKey: params.inviterPrivateKey,
        recipientUuid: user.user_uuid,
      })

      if (!encryptedVaultData) {
        errors.push(ClientDisplayableError.FromString(`Failed to encrypt vault key for user ${user.user_uuid}`))
        continue
      }

      const createInviteUseCase = new CreateVaultInviteUseCase(this.vaultInvitesServer)
      const createInviteResult = await createInviteUseCase.execute({
        vaultUuid: params.vaultUuid,
        inviteeUuid: user.user_uuid,
        inviterPublicKey: params.inviterPublicKey,
        encryptedVaultData,
        inviteType: VaultInviteType.KeyChange,
        permissions: user.permissions,
      })

      if (isClientDisplayableError(createInviteResult)) {
        errors.push(createInviteResult)
      }
    }

    return errors
  }

  private getEncryptedVaultDataForRecipient(params: {
    vaultData: VaultKeyContentSpecialized
    inviterPrivateKey: string
    recipientUuid: string
  }): string | undefined {
    const trustedContact = this.contacts.findTrustedContact(params.recipientUuid)
    if (!trustedContact) {
      return
    }

    return this.encryption.encryptVaultDataWithRecipientPublicKey(
      params.vaultData,
      params.inviterPrivateKey,
      trustedContact.publicKey,
    )
  }
}
