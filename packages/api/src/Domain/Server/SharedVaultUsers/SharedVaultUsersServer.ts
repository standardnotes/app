import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { GetSharedVaultUsersRequestParams } from '../../Request/SharedVaultUser/GetSharedVaultUsersRequestParams'
import { DeleteSharedVaultUserRequestParams } from '../../Request/SharedVaultUser/DeleteSharedVaultUserRequestParams'
import { DeleteSharedVaultUserResponse } from '../../Response/SharedVaultUsers/DeleteSharedVaultUserResponse'
import { SharedVaultUsersServerInterface } from './SharedVaultUsersServerInterface'
import { SharedVaultUsersPaths } from './Paths'
import { GetSharedVaultUsersResponse } from '../../Response/SharedVaultUsers/GetSharedVaultUsersResponse'

export class SharedVaultUsersServer implements SharedVaultUsersServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  getSharedVaultUsers(params: GetSharedVaultUsersRequestParams): Promise<HttpResponse<GetSharedVaultUsersResponse>> {
    return this.httpService.get(SharedVaultUsersPaths.getSharedVaultUsers(params.sharedVaultUuid))
  }

  deleteSharedVaultUser(params: DeleteSharedVaultUserRequestParams): Promise<HttpResponse<DeleteSharedVaultUserResponse>> {
    return this.httpService.delete(SharedVaultUsersPaths.deleteSharedVaultUser(params.sharedVaultUuid, params.userUuid))
  }
}
