import { HttpResponse } from '@standardnotes/responses'
import { CreateGroupResponse } from '../../Response/Group/CreateGroupResponse'
import { CreateGroupParams } from '../../Request/Group/CreateGroupParams'
import { UpdateGroupParams } from '../../Request/Group/UpdateGroupParams'
import { UpdateGroupResponse } from '../../Response/Group/UpdateGroupResponse'
import { GetGroupsResponse } from '../../Response/Group/GetGroupsResponse'

export interface GroupsServerInterface {
  getGroups(): Promise<HttpResponse<GetGroupsResponse>>

  createGroup(params: CreateGroupParams): Promise<HttpResponse<CreateGroupResponse>>

  updateGroup(params: UpdateGroupParams): Promise<HttpResponse<UpdateGroupResponse>>

  deleteGroup(params: { groupUuid: string }): Promise<HttpResponse<boolean>>
}
