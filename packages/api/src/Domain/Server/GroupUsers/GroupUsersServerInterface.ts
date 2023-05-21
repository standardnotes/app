import { HttpResponse } from '@standardnotes/responses'
import { GetGroupUsersRequestParams } from '../../Request/GroupUser/GetGroupUsersRequestParams'
import { DeleteGroupUserRequestParams } from '../../Request/GroupUser/DeleteGroupUserRequestParams'
import { DeleteGroupUserResponse } from '../../Response/GroupUsers/DeleteGroupUserResponse'
import { GetGroupUsersResponse } from '../../Response/GroupUsers/GetGroupUsersResponse'

export interface GroupUsersServerInterface {
  getGroupUsers(params: GetGroupUsersRequestParams): Promise<HttpResponse<GetGroupUsersResponse>>

  deleteGroupUser(params: DeleteGroupUserRequestParams): Promise<HttpResponse<DeleteGroupUserResponse>>
}
