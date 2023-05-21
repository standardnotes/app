import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { GroupsServerInterface } from './GroupsServerInterface'
import { CreateGroupParams } from '../../Request/Group/CreateGroupParams'
import { GroupsPaths } from './Paths'
import { CreateGroupResponse } from '../../Response/Group/CreateGroupResponse'
import { UpdateGroupParams } from '../../Request/Group/UpdateGroupParams'
import { UpdateGroupResponse } from '../../Response/Group/UpdateGroupResponse'

export class GroupsServer implements GroupsServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  createGroup(params: CreateGroupParams): Promise<HttpResponse<CreateGroupResponse>> {
    return this.httpService.post(GroupsPaths.createGroup, {
      specified_items_key_uuid: params.specifiedItemsKeyUuid,
    })
  }

  deleteGroup(params: { groupUuid: string }): Promise<HttpResponse<boolean>> {
    return this.httpService.delete(GroupsPaths.deleteGroup(params.groupUuid))
  }

  updateGroup(params: UpdateGroupParams): Promise<HttpResponse<UpdateGroupResponse>> {
    return this.httpService.patch(GroupsPaths.updateGroup(params.groupUuid), {
      specified_items_key_uuid: params.specifiedItemsKeyUuid,
    })
  }
}
