import {
  ClientDisplayableError,
  SharedVaultInviteServerHash,
  SharedVaultInviteType,
  isErrorResponse,
  SharedVaultPermission,
} from '@standardnotes/responses'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'

export class UpdateSharedVaultInviteUseCase {
  constructor(private vaultInvitesServer: SharedVaultInvitesServerInterface) {}

  async execute(params: {
    sharedVaultUuid: string
    inviteUuid: string
    inviterPublicKey: string
    encryptedMessage: string
    inviteType: SharedVaultInviteType
    permissions: SharedVaultPermission
  }): Promise<SharedVaultInviteServerHash | ClientDisplayableError> {
    const response = await this.vaultInvitesServer.updateInvite({
      sharedVaultUuid: params.sharedVaultUuid,
      inviteUuid: params.inviteUuid,
      inviterPublicKey: params.inviterPublicKey,
      encryptedMessage: params.encryptedMessage,
      permissions: params.permissions,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.invite
  }
}
