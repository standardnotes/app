import {
  ClientDisplayableError,
  SharedVaultInviteServerHash,
  isErrorResponse,
  SharedVaultPermission,
} from '@standardnotes/responses'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'

export class UpdateSharedVaultInviteUseCase {
  constructor(private vaultInvitesServer: SharedVaultInvitesServerInterface) {}

  async execute(params: {
    sharedVaultUuid: string
    inviteUuid: string
    senderPublicKey: string
    encryptedMessage: string
    permissions: SharedVaultPermission
  }): Promise<SharedVaultInviteServerHash | ClientDisplayableError> {
    const response = await this.vaultInvitesServer.updateInvite({
      sharedVaultUuid: params.sharedVaultUuid,
      inviteUuid: params.inviteUuid,
      senderPublicKey: params.senderPublicKey,
      encryptedMessage: params.encryptedMessage,
      permissions: params.permissions,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.invite
  }
}
