import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { GroupsServerInterface } from './GroupsServerInterface'
import { CreateGroupParams } from '../../Request/Group/CreateGroupParams'
import { GroupsPaths } from './Paths'
import { GetGroupUsersResponse } from '../../Response/Group/GetGroupUsersResponse'
import { CreateGroupResponse } from '../../Response/Group/CreateGroupResponse'

export class GroupsServer implements GroupsServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  createGroup(params: CreateGroupParams): Promise<HttpResponse<CreateGroupResponse>> {
    return this.httpService.post(GroupsPaths.createGroup, {
      creator_public_key: params.creatorPublicKey,
      encrypted_group_key: params.encryptedGroupKey,
    })
  }

  deleteGroup(params: { groupUuid: string }): Promise<HttpResponse<boolean>> {
    return this.httpService.delete(GroupsPaths.deleteGroup(params.groupUuid))
  }

  removeUserFromGroup(params: { groupUuid: string; userUuid: string }): Promise<HttpResponse<boolean>> {
    return this.httpService.delete(GroupsPaths.removeUserFromGroup(params.groupUuid, params.userUuid))
  }

  getGroupUsers(params: { groupUuid: string }): Promise<HttpResponse<GetGroupUsersResponse>> {
    return this.httpService.get(GroupsPaths.getGroupUsers(params.groupUuid))
  }
}
