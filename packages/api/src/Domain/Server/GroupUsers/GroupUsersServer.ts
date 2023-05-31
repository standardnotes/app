import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { GetGroupUsersRequestParams } from '../../Request/GroupUser/GetGroupUsersRequestParams'
import { DeleteGroupUserRequestParams } from '../../Request/GroupUser/DeleteGroupUserRequestParams'
import { DeleteGroupUserResponse } from '../../Response/GroupUsers/DeleteGroupUserResponse'
import { GroupUsersServerInterface } from './GroupUsersServerInterface'
import { GroupUsersPaths } from './Paths'
import { GetGroupUsersResponse } from '../../Response/GroupUsers/GetGroupUsersResponse'

export class GroupUsersServer implements GroupUsersServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  getGroupUsers(params: GetGroupUsersRequestParams): Promise<HttpResponse<GetGroupUsersResponse>> {
    return this.httpService.get(GroupUsersPaths.getGroupUsers(params.groupUuid))
  }

  deleteGroupUser(params: DeleteGroupUserRequestParams): Promise<HttpResponse<DeleteGroupUserResponse>> {
    return this.httpService.delete(GroupUsersPaths.deleteGroupUser(params.groupUuid, params.userUuid))
  }
}
