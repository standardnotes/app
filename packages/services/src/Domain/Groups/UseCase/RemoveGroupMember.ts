import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { GroupUsersServerInterface } from '@standardnotes/api'

export class RemoveGroupMemberUseCase {
  constructor(private groupUserServer: GroupUsersServerInterface) {}

  async execute(params: { groupUuid: string; memberUuid: string }): Promise<ClientDisplayableError | void> {
    const response = await this.groupUserServer.deleteGroupUser({
      groupUuid: params.groupUuid,
      userUuid: params.memberUuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to remove group user ${response}`)
    }
  }
}
