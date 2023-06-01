import { ClientDisplayableError, GroupServerHash, isErrorResponse } from '@standardnotes/responses'
import { GroupServerInterface } from '@standardnotes/api'

export class UpdateGroupUseCase {
  constructor(private groupServer: GroupServerInterface) {}

  async execute(params: {
    groupUuid: string
    specifiedItemsKeyUuid: string
  }): Promise<GroupServerHash | ClientDisplayableError> {
    const response = await this.groupServer.updateGroup({
      groupUuid: params.groupUuid,
      specifiedItemsKeyUuid: params.specifiedItemsKeyUuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.group
  }
}
