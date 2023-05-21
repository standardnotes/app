import { GroupUserServerHash, isErrorResponse } from '@standardnotes/responses'
import { GroupUsersServerInterface } from '@standardnotes/api'

export class GetGroupUsersUseCase {
  constructor(private groupUsersServer: GroupUsersServerInterface) {}

  async execute(params: { groupUuid: string }): Promise<GroupUserServerHash[] | undefined> {
    const response = await this.groupUsersServer.getGroupUsers({ groupUuid: params.groupUuid })

    if (isErrorResponse(response)) {
      return undefined
    }

    return response.data.users
  }
}
