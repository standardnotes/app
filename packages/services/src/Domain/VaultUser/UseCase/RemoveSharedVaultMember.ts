import { getErrorFromErrorResponse, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultUsersServerInterface } from '@standardnotes/api'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class RemoveVaultMember implements UseCaseInterface<void> {
  constructor(private vaultUserServer: SharedVaultUsersServerInterface) {}

  async execute(params: { sharedVaultUuid: string; userUuid: string }): Promise<Result<void>> {
    const response = await this.vaultUserServer.deleteSharedVaultUser({
      sharedVaultUuid: params.sharedVaultUuid,
      userUuid: params.userUuid,
    })

    if (isErrorResponse(response)) {
      return Result.fail(getErrorFromErrorResponse(response).message)
    }

    return Result.ok()
  }
}
