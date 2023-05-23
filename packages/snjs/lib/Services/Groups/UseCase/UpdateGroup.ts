import { ClientDisplayableError, GroupServerHash, isErrorResponse } from '@standardnotes/responses'
import { GroupsServerInterface } from '@standardnotes/api'

export class UpdateGroupUseCase {
  constructor(private groupsServer: GroupsServerInterface) {}

  async execute(params: {
    groupUuid: string
    specifiedItemsKeyUuid: string
    groupKeyTimestamp: number
  }): Promise<GroupServerHash | ClientDisplayableError> {
    const response = await this.groupsServer.updateGroup({
      groupUuid: params.groupUuid,
      specifiedItemsKeyUuid: params.specifiedItemsKeyUuid,
      groupKeyTimestamp: params.groupKeyTimestamp,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.group
  }
}
