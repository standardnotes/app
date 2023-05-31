import { GroupUserServerHash, isErrorResponse } from '@standardnotes/responses'
import { GroupUsersServerInterface } from '@standardnotes/api'

export class GetGroupUsersUseCase {
  constructor(private vaultUsersServer: GroupUsersServerInterface) {}

  async execute(params: { groupUuid: string }): Promise<GroupUserServerHash[] | undefined> {
    const response = await this.vaultUsersServer.getGroupUsers({ groupUuid: params.groupUuid })

    if (isErrorResponse(response)) {
      return undefined
    }

    return response.data.users
  }
}
