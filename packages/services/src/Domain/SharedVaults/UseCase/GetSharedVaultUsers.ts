import { SharedVaultUserServerHash, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultUsersServerInterface } from '@standardnotes/api'

export class GetSharedVaultUsersUseCase {
  constructor(private vaultUsersServer: SharedVaultUsersServerInterface) {}

  async execute(params: { sharedVaultUuid: string }): Promise<SharedVaultUserServerHash[] | undefined> {
    const response = await this.vaultUsersServer.getSharedVaultUsers({ sharedVaultUuid: params.sharedVaultUuid })

    if (isErrorResponse(response)) {
      return undefined
    }

    return response.data.users
  }
}
