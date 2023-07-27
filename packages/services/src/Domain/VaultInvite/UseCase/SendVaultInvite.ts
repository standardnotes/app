import { SharedVaultInviteServerHash, isErrorResponse, getErrorFromErrorResponse } from '@standardnotes/responses'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { Result, SharedVaultUserPermission, UseCaseInterface } from '@standardnotes/domain-core'

export class SendVaultInvite implements UseCaseInterface<SharedVaultInviteServerHash> {
  constructor(private vaultInvitesServer: SharedVaultInvitesServerInterface) {}

  async execute(params: {
    sharedVaultUuid: string
    recipientUuid: string
    encryptedMessage: string
    permission: string
  }): Promise<Result<SharedVaultInviteServerHash>> {
    const permissionOrError = SharedVaultUserPermission.create(params.permission)
    if (permissionOrError.isFailed()) {
      return Result.fail(permissionOrError.getError())
    }
    const permission = permissionOrError.getValue()

    const response = await this.vaultInvitesServer.createInvite({
      sharedVaultUuid: params.sharedVaultUuid,
      recipientUuid: params.recipientUuid,
      encryptedMessage: params.encryptedMessage,
      permission: permission,
    })

    if (isErrorResponse(response)) {
      return Result.fail(getErrorFromErrorResponse(response).message)
    }

    return Result.ok(response.data.invite)
  }
}
