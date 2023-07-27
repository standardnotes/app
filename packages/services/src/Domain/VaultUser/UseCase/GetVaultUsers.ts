import { VaultUserCache } from './../VaultUserCache'
import { SharedVaultUserServerHash, getErrorFromErrorResponse, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultUsersServerInterface } from '@standardnotes/api'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class GetVaultUsers implements UseCaseInterface<SharedVaultUserServerHash[]> {
  constructor(
    private vaultUsersServer: SharedVaultUsersServerInterface,
    private cache: VaultUserCache,
  ) {}

  async execute(params: {
    sharedVaultUuid: string
    readFromCache: boolean
  }): Promise<Result<SharedVaultUserServerHash[]>> {
    if (params.readFromCache) {
      const cachedUsers = this.cache.get(params.sharedVaultUuid)

      if (cachedUsers) {
        return Result.ok(cachedUsers)
      }
    }

    const response = await this.vaultUsersServer.getSharedVaultUsers({ sharedVaultUuid: params.sharedVaultUuid })

    if (isErrorResponse(response)) {
      return Result.fail(getErrorFromErrorResponse(response).message)
    }

    this.cache.set(params.sharedVaultUuid, response.data.users)

    return Result.ok(response.data.users)
  }
}
