import { HttpResponse } from '@standardnotes/responses'
import { GetGroupUsersResponse } from '../../Response/Group/GetGroupUsersResponse'
import { CreateGroupResponse } from '../../Response/Group/CreateGroupResponse'
import { CreateGroupParams } from '../../Request/Group/CreateGroupParams'

export interface GroupsServerInterface {
  createGroup(params: CreateGroupParams): Promise<HttpResponse<CreateGroupResponse>>

  deleteGroup(params: { groupUuid: string }): Promise<HttpResponse<boolean>>

  removeUserFromGroup(params: { groupUuid: string; userUuid: string }): Promise<HttpResponse<boolean>>

  getGroupUsers(params: { groupUuid: string }): Promise<HttpResponse<GetGroupUsersResponse>>
}
