import { HttpResponse } from '@standardnotes/responses'
import { GetGroupUsersRequestParams } from '../../Request/GroupUser/GetGroupUsersRequestParams'
import { GetGroupUsersResponse } from '../../Response/Group/GetGroupUsersResponse'
import { DeleteGroupUserRequestParams } from '../../Request/GroupUser/DeleteGroupUserRequestParams'
import { DeleteGroupUserResponse } from '../../Response/GroupUsers/DeleteGroupUserResponse'

export interface GroupUsersServerInterface {
  getGroupUsers(params: GetGroupUsersRequestParams): Promise<HttpResponse<GetGroupUsersResponse>>

  deleteGroupUser(params: DeleteGroupUserRequestParams): Promise<HttpResponse<DeleteGroupUserResponse>>
}
