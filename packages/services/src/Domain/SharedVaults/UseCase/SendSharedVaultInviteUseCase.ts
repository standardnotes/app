import {
  ClientDisplayableError,
  SharedVaultInviteServerHash,
  isErrorResponse,
  SharedVaultPermission,
} from '@standardnotes/responses'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'

export class SendSharedVaultInviteUseCase {
  constructor(private vaultInvitesServer: SharedVaultInvitesServerInterface) {}

  async execute(params: {
    sharedVaultUuid: string
    recipientUuid: string
    senderPublicKey: string
    encryptedMessage: string
    permissions: SharedVaultPermission
  }): Promise<SharedVaultInviteServerHash | ClientDisplayableError> {
    const response = await this.vaultInvitesServer.createInvite({
      sharedVaultUuid: params.sharedVaultUuid,
      recipientUuid: params.recipientUuid,
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
