import { HttpResponse } from '@standardnotes/responses'
import { CreateGroupResponse } from '../../Response/Group/CreateGroupResponse'
import { CreateGroupParams } from '../../Request/Group/CreateGroupParams'
import { UpdateGroupParams } from '../../Request/Group/UpdateGroupParams'
import { UpdateGroupResponse } from '../../Response/Group/UpdateGroupResponse'
import { GetGroupsResponse } from '../../Response/Group/GetGroupsResponse'
import { CreateGroupValetTokenResponse } from '../../Response/Group/CreateGroupValetTokenResponse'
import { CreateGroupValetTokenParams } from '../../Request/Group/CreateGroupValetTokenParams'
import { GetRemovedGroupsResponse } from '../../Response/Group/GetRemovedGroups'
import { AddItemToGroupRequestParams } from '../../Request/Group/AddItemToGroup'
import { AddItemToGroupResponse } from '../../Response/Group/AddItemToGroupResponse'
import { RemoveItemFromGroupParams } from '../../Request/Group/RemoveItemFromGroup'
import { RemoveItemFromGroupResponse } from '../../Response/Group/RemoveItemFromGroupResponse'

export interface GroupServerInterface {
  getGroups(): Promise<HttpResponse<GetGroupsResponse>>
  getRemovedGroups(): Promise<HttpResponse<GetRemovedGroupsResponse>>

  createGroup(params: CreateGroupParams): Promise<HttpResponse<CreateGroupResponse>>
  updateGroup(params: UpdateGroupParams): Promise<HttpResponse<UpdateGroupResponse>>
  deleteGroup(params: { groupUuid: string }): Promise<HttpResponse<boolean>>

  addItemToGroup(params: AddItemToGroupRequestParams): Promise<HttpResponse<AddItemToGroupResponse>>
  removeItemFromGroup(params: RemoveItemFromGroupParams): Promise<HttpResponse<RemoveItemFromGroupResponse>>

  createGroupFileValetToken(params: CreateGroupValetTokenParams): Promise<HttpResponse<CreateGroupValetTokenResponse>>
}
