import {
  ClientDisplayableError,
  SharedVaultInviteServerHash,
  SharedVaultInviteType,
  isErrorResponse,
  SharedVaultPermission,
} from '@standardnotes/responses'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'

export class CreateSharedVaultInviteUseCase {
  constructor(private vaultInvitesServer: SharedVaultInvitesServerInterface) {}

  async execute(params: {
    sharedVaultUuid: string
    inviteeUuid: string
    inviterPublicKey: string
    encryptedMessage: string
    inviteType: SharedVaultInviteType
    permissions: SharedVaultPermission
  }): Promise<SharedVaultInviteServerHash | ClientDisplayableError> {
    const response = await this.vaultInvitesServer.createInvite({
      sharedVaultUuid: params.sharedVaultUuid,
      inviteeUuid: params.inviteeUuid,
      inviterPublicKey: params.inviterPublicKey,
      encryptedMessage: params.encryptedMessage,
      inviteType: params.inviteType,
      permissions: params.permissions,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.invite
  }
}
