import { VaultUserServerHash, isErrorResponse } from '@standardnotes/responses'
import { VaultUsersServerInterface } from '@standardnotes/api'

export class GetVaultUsersUseCase {
  constructor(private vaultUsersServer: VaultUsersServerInterface) {}

  async execute(params: { vaultUuid: string }): Promise<VaultUserServerHash[] | undefined> {
    const response = await this.vaultUsersServer.getVaultUsers({ vaultUuid: params.vaultUuid })

    if (isErrorResponse(response)) {
      return undefined
    }

    return response.data.users
  }
}
