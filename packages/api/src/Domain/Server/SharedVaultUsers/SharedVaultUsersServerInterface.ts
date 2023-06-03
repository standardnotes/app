import { HttpResponse } from '@standardnotes/responses'
import { GetSharedVaultUsersRequestParams } from '../../Request/SharedVaultUser/GetSharedVaultUsersRequestParams'
import { DeleteSharedVaultUserRequestParams } from '../../Request/SharedVaultUser/DeleteSharedVaultUserRequestParams'
import { DeleteSharedVaultUserResponse } from '../../Response/SharedVaultUsers/DeleteSharedVaultUserResponse'
import { GetSharedVaultUsersResponse } from '../../Response/SharedVaultUsers/GetSharedVaultUsersResponse'

export interface SharedVaultUsersServerInterface {
  getSharedVaultUsers(params: GetSharedVaultUsersRequestParams): Promise<HttpResponse<GetSharedVaultUsersResponse>>

  deleteSharedVaultUser(params: DeleteSharedVaultUserRequestParams): Promise<HttpResponse<DeleteSharedVaultUserResponse>>
}
