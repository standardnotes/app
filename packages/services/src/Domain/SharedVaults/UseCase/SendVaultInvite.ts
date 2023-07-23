import {
  SharedVaultInviteServerHash,
  isErrorResponse,
  SharedVaultPermission,
  getErrorFromErrorResponse,
} from '@standardnotes/responses'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class SendVaultInvite implements UseCaseInterface<SharedVaultInviteServerHash> {
  constructor(private vaultInvitesServer: SharedVaultInvitesServerInterface) {}

  async execute(params: {
    sharedVaultUuid: string
    recipientUuid: string
    encryptedMessage: string
    permissions: SharedVaultPermission
  }): Promise<Result<SharedVaultInviteServerHash>> {
    const response = await this.vaultInvitesServer.createInvite({
      sharedVaultUuid: params.sharedVaultUuid,
      recipientUuid: params.recipientUuid,
      encryptedMessage: params.encryptedMessage,
      permissions: params.permissions,
    })

    if (isErrorResponse(response)) {
      return Result.fail(getErrorFromErrorResponse(response).message)
    }

    return Result.ok(response.data.invite)
  }
}
