import { KeySystemIdentifier, KeySystemRootKeyContentSpecialized } from '@standardnotes/models'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import {
  ClientDisplayableError,
  SharedVaultInviteType,
  isClientDisplayableError,
  isErrorResponse,
} from '@standardnotes/responses'
import { SharedVaultInvitesServerInterface, SharedVaultUsersServerInterface } from '@standardnotes/api'
import { GetSharedVaultUsersUseCase } from './GetSharedVaultUsers'
import { CreateSharedVaultInviteUseCase } from './CreateSharedVaultInvite'
import { UpdateSharedVaultInviteUseCase } from './UpdateSharedVaultInvite'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class UpdateInvitesAfterSharedVaultDataChangeUseCase {
  constructor(
    private encryption: EncryptionProviderInterface,
    private vaultInvitesServer: SharedVaultInvitesServerInterface,
    private vaultUsersServer: SharedVaultUsersServerInterface,
    private contacts: ContactServiceInterface,
    private items: ItemManagerInterface,
  ) {}

  async execute(params: {
    keySystemIdentifier: KeySystemIdentifier
    sharedVaultUuid: string
    inviterUuid: string
    inviterPrivateKey: string
    inviterPublicKey: string
  }): Promise<ClientDisplayableError[]> {
    const keySystemRootKey = this.items.getPrimaryKeySystemRootKey(params.keySystemIdentifier)
    if (!keySystemRootKey) {
      throw new Error(`Vault key not found for keySystemIdentifier ${params.keySystemIdentifier}`)
    }

    const errors: ClientDisplayableError[] = []

    const reuploadErrors = await this.reuploadExistingInvites({
      sharedVaultUuid: params.sharedVaultUuid,
      keySystemRootKeyData: keySystemRootKey.content,
      inviterUuid: params.inviterUuid,
      inviterPrivateKey: params.inviterPrivateKey,
      inviterPublicKey: params.inviterPublicKey,
    })
    errors.push(...reuploadErrors)

    const inviteErrors = await this.sendKeyChangeInviteToAcceptedVaultMembers({
      sharedVaultUuid: params.sharedVaultUuid,
      keySystemRootKeyData: keySystemRootKey.content,
      inviterUuid: params.inviterUuid,
      inviterPrivateKey: params.inviterPrivateKey,
      inviterPublicKey: params.inviterPublicKey,
    })
    errors.push(...inviteErrors)

    return errors
  }

  private async reuploadExistingInvites(params: {
    sharedVaultUuid: string
    keySystemRootKeyData: KeySystemRootKeyContentSpecialized
    inviterUuid: string
    inviterPrivateKey: string
    inviterPublicKey: string
  }): Promise<ClientDisplayableError[]> {
    const response = await this.vaultInvitesServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return [ClientDisplayableError.FromString(`Failed to get outbound user invites ${response}`)]
    }

    const invites = response.data.invites

    const existingSharedVaultInvites = invites.filter((invite) => invite.shared_vault_uuid === params.sharedVaultUuid)

    const errors: ClientDisplayableError[] = []

    for (const invite of existingSharedVaultInvites) {
      const encryptedKeySystemRootKeyContent = this.getEncryptedVaultDataForRecipient({
        keySystemRootKeyData: params.keySystemRootKeyData,
        inviterPrivateKey: params.inviterPrivateKey,
        recipientUuid: invite.user_uuid,
      })

      if (!encryptedKeySystemRootKeyContent) {
        errors.push(
          ClientDisplayableError.FromString(`Failed to encrypt key system root key for user ${invite.user_uuid}`),
        )
        continue
      }

      const updateInviteUseCase = new UpdateSharedVaultInviteUseCase(this.vaultInvitesServer)
      const updateInviteResult = await updateInviteUseCase.execute({
        sharedVaultUuid: params.sharedVaultUuid,
        inviteUuid: invite.uuid,
        inviterPublicKey: params.inviterPublicKey,
        encryptedKeySystemRootKeyContent,
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
    sharedVaultUuid: string
    keySystemRootKeyData: KeySystemRootKeyContentSpecialized
    inviterUuid: string
    inviterPrivateKey: string
    inviterPublicKey: string
  }): Promise<ClientDisplayableError[]> {
    const getUsersUseCase = new GetSharedVaultUsersUseCase(this.vaultUsersServer)
    const users = await getUsersUseCase.execute({ sharedVaultUuid: params.sharedVaultUuid })
    if (!users) {
      return [ClientDisplayableError.FromString('Cannot rotate key system root key; users not found')]
    }
    if (users.length === 0) {
      return []
    }

    const errors: ClientDisplayableError[] = []

    for (const user of users) {
      if (user.user_uuid === params.inviterUuid) {
        continue
      }

      const encryptedKeySystemRootKeyContent = this.getEncryptedVaultDataForRecipient({
        keySystemRootKeyData: params.keySystemRootKeyData,
        inviterPrivateKey: params.inviterPrivateKey,
        recipientUuid: user.user_uuid,
      })

      if (!encryptedKeySystemRootKeyContent) {
        errors.push(
          ClientDisplayableError.FromString(`Failed to encrypt key system root key for user ${user.user_uuid}`),
        )
        continue
      }

      const createInviteUseCase = new CreateSharedVaultInviteUseCase(this.vaultInvitesServer)
      const createInviteResult = await createInviteUseCase.execute({
        sharedVaultUuid: params.sharedVaultUuid,
        inviteeUuid: user.user_uuid,
        inviterPublicKey: params.inviterPublicKey,
        encryptedKeySystemRootKeyContent,
        inviteType: SharedVaultInviteType.KeyChange,
        permissions: user.permissions,
      })

      if (isClientDisplayableError(createInviteResult)) {
        errors.push(createInviteResult)
      }
    }

    return errors
  }

  private getEncryptedVaultDataForRecipient(params: {
    keySystemRootKeyData: KeySystemRootKeyContentSpecialized
    inviterPrivateKey: string
    recipientUuid: string
  }): string | undefined {
    const trustedContact = this.contacts.findTrustedContact(params.recipientUuid)
    if (!trustedContact) {
      return
    }

    return this.encryption.asymmetricallyEncryptSharedVaultMessage(
      params.keySystemRootKeyData,
      params.inviterPrivateKey,
      trustedContact.publicKey,
    )
  }
}
