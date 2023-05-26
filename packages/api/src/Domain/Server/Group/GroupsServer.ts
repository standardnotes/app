import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { GroupsServerInterface } from './GroupsServerInterface'
import { CreateGroupParams } from '../../Request/Group/CreateGroupParams'
import { GroupsPaths } from './Paths'
import { CreateGroupResponse } from '../../Response/Group/CreateGroupResponse'
import { UpdateGroupParams } from '../../Request/Group/UpdateGroupParams'
import { UpdateGroupResponse } from '../../Response/Group/UpdateGroupResponse'
import { GetGroupsResponse } from '../../Response/Group/GetGroupsResponse'
import { CreateGroupValetTokenResponse } from '../../Response/Group/CreateGroupValetTokenResponse'
import { CreateGroupValetTokenParams } from '../../Request/Group/CreateGroupValetTokenParams'

export class GroupsServer implements GroupsServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  getGroups(): Promise<HttpResponse<GetGroupsResponse>> {
    return this.httpService.get(GroupsPaths.getGroups)
  }

  createGroup(params: CreateGroupParams): Promise<HttpResponse<CreateGroupResponse>> {
    return this.httpService.post(GroupsPaths.createGroup, {
      group_uuid: params.groupUuid,
      specified_items_key_uuid: params.specifiedItemsKeyUuid,
      group_key_timestamp: params.groupKeyTimestamp,
    })
  }

  deleteGroup(params: { groupUuid: string }): Promise<HttpResponse<boolean>> {
    return this.httpService.delete(GroupsPaths.deleteGroup(params.groupUuid))
  }

  updateGroup(params: UpdateGroupParams): Promise<HttpResponse<UpdateGroupResponse>> {
    return this.httpService.patch(GroupsPaths.updateGroup(params.groupUuid), {
      specified_items_key_uuid: params.specifiedItemsKeyUuid,
      group_key_timestamp: params.groupKeyTimestamp,
    })
  }

  createForeignFileReadValetToken(
    params: CreateGroupValetTokenParams,
  ): Promise<HttpResponse<CreateGroupValetTokenResponse>> {
    return this.httpService.post(GroupsPaths.createFileValetToken(params.groupUuid), {
      file_uuid: params.fileUuid,
      remote_identifier: params.remoteIdentifier,
    })
  }
}
