import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultUsersServerInterface } from '@standardnotes/api'

export class RemoveVaultMemberUseCase {
  constructor(private vaultUserServer: SharedVaultUsersServerInterface) {}

  async execute(params: { sharedVaultUuid: string; userUuid: string }): Promise<ClientDisplayableError | void> {
    const response = await this.vaultUserServer.deleteSharedVaultUser({
      sharedVaultUuid: params.sharedVaultUuid,
      userUuid: params.userUuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromNetworkError(response)
    }
  }
}
