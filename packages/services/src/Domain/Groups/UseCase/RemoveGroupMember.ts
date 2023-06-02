import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { GroupUsersServerInterface } from '@standardnotes/api'

export class RemoveVaultMemberUseCase {
  constructor(private vaultUserServer: GroupUsersServerInterface) {}

  async execute(params: { groupUuid: string; userUuid: string }): Promise<ClientDisplayableError | void> {
    const response = await this.vaultUserServer.deleteGroupUser({
      groupUuid: params.groupUuid,
      userUuid: params.userUuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromNetworkError(response)
    }
  }
}
