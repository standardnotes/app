import { VaultKeyCopyContentSpecialized } from '@standardnotes/models'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import {
  ClientDisplayableError,
  GroupInviteType,
  isClientDisplayableError,
  isErrorResponse,
} from '@standardnotes/responses'
import { GroupInvitesServerInterface, GroupUsersServerInterface } from '@standardnotes/api'
import { GetGroupUsersUseCase } from './GetGroupUsers'
import { CreateGroupInviteUseCase } from './CreateGroupInvite'
import { UpdateGroupInviteUseCase } from './UpdateGroupInvite'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class UpdateInvitesAfterGroupDataChangeUseCase {
  constructor(
    private encryption: EncryptionProviderInterface,
    private vaultInvitesServer: GroupInvitesServerInterface,
    private vaultUsersServer: GroupUsersServerInterface,
    private contacts: ContactServiceInterface,
    private items: ItemManagerInterface,
  ) {}

  async execute(params: {
    vaultSystemIdentifier: string
    groupUuid: string
    inviterUuid: string
    inviterPrivateKey: string
    inviterPublicKey: string
  }): Promise<ClientDisplayableError[]> {
    const vaultKeyCopy = this.items.getPrimarySyncedVaultKeyCopy(params.vaultSystemIdentifier)
    if (!vaultKeyCopy) {
      throw new Error(`Vault key not found for vaultSystemIdentifier ${params.vaultSystemIdentifier}`)
    }

    const errors: ClientDisplayableError[] = []

    const reuploadErrors = await this.reuploadExistingInvites({
      groupUuid: params.groupUuid,
      vaultKeyData: vaultKeyCopy.content,
      inviterUuid: params.inviterUuid,
      inviterPrivateKey: params.inviterPrivateKey,
      inviterPublicKey: params.inviterPublicKey,
    })
    errors.push(...reuploadErrors)

    const inviteErrors = await this.sendKeyChangeInviteToAcceptedVaultMembers({
      groupUuid: params.groupUuid,
      vaultKeyData: vaultKeyCopy.content,
      inviterUuid: params.inviterUuid,
      inviterPrivateKey: params.inviterPrivateKey,
      inviterPublicKey: params.inviterPublicKey,
    })
    errors.push(...inviteErrors)

    return errors
  }

  private async reuploadExistingInvites(params: {
    groupUuid: string
    vaultKeyData: VaultKeyCopyContentSpecialized
    inviterUuid: string
    inviterPrivateKey: string
    inviterPublicKey: string
  }): Promise<ClientDisplayableError[]> {
    const response = await this.vaultInvitesServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return [ClientDisplayableError.FromString(`Failed to get outbound user invites ${response}`)]
    }

    const invites = response.data.invites

    const existingGroupInvites = invites.filter((invite) => invite.group_uuid === params.groupUuid)

    const errors: ClientDisplayableError[] = []

    for (const invite of existingGroupInvites) {
      const encryptedVaultKeyContent = this.getEncryptedVaultDataForRecipient({
        vaultKeyData: params.vaultKeyData,
        inviterPrivateKey: params.inviterPrivateKey,
        recipientUuid: invite.user_uuid,
      })

      if (!encryptedVaultKeyContent) {
        errors.push(ClientDisplayableError.FromString(`Failed to encrypt vault key for user ${invite.user_uuid}`))
        continue
      }

      const updateInviteUseCase = new UpdateGroupInviteUseCase(this.vaultInvitesServer)
      const updateInviteResult = await updateInviteUseCase.execute({
        groupUuid: params.groupUuid,
        inviteUuid: invite.uuid,
        inviterPublicKey: params.inviterPublicKey,
        encryptedVaultKeyContent,
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
    groupUuid: string
    vaultKeyData: VaultKeyCopyContentSpecialized
    inviterUuid: string
    inviterPrivateKey: string
    inviterPublicKey: string
  }): Promise<ClientDisplayableError[]> {
    const getUsersUseCase = new GetGroupUsersUseCase(this.vaultUsersServer)
    const users = await getUsersUseCase.execute({ groupUuid: params.groupUuid })
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

      const encryptedVaultKeyContent = this.getEncryptedVaultDataForRecipient({
        vaultKeyData: params.vaultKeyData,
        inviterPrivateKey: params.inviterPrivateKey,
        recipientUuid: user.user_uuid,
      })

      if (!encryptedVaultKeyContent) {
        errors.push(ClientDisplayableError.FromString(`Failed to encrypt vault key for user ${user.user_uuid}`))
        continue
      }

      const createInviteUseCase = new CreateGroupInviteUseCase(this.vaultInvitesServer)
      const createInviteResult = await createInviteUseCase.execute({
        groupUuid: params.groupUuid,
        inviteeUuid: user.user_uuid,
        inviterPublicKey: params.inviterPublicKey,
        encryptedVaultKeyContent,
        inviteType: GroupInviteType.KeyChange,
        permissions: user.permissions,
      })

      if (isClientDisplayableError(createInviteResult)) {
        errors.push(createInviteResult)
      }
    }

    return errors
  }

  private getEncryptedVaultDataForRecipient(params: {
    vaultKeyData: VaultKeyCopyContentSpecialized
    inviterPrivateKey: string
    recipientUuid: string
  }): string | undefined {
    const trustedContact = this.contacts.findTrustedContact(params.recipientUuid)
    if (!trustedContact) {
      return
    }

    return this.encryption.encryptVaultKeyContentWithRecipientPublicKey(
      params.vaultKeyData,
      params.inviterPrivateKey,
      trustedContact.publicKey,
    )
  }
}
