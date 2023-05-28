import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { GetVaultUsersRequestParams } from '../../Request/VaultUser/GetVaultUsersRequestParams'
import { DeleteVaultUserRequestParams } from '../../Request/VaultUser/DeleteVaultUserRequestParams'
import { DeleteVaultUserResponse } from '../../Response/VaultUsers/DeleteVaultUserResponse'
import { VaultUsersServerInterface } from './VaultUsersServerInterface'
import { VaultUsersPaths } from './Paths'
import { GetVaultUsersResponse } from '../../Response/VaultUsers/GetVaultUsersResponse'

export class VaultUsersServer implements VaultUsersServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  getVaultUsers(params: GetVaultUsersRequestParams): Promise<HttpResponse<GetVaultUsersResponse>> {
    return this.httpService.get(VaultUsersPaths.getVaultUsers(params.vaultUuid))
  }

  deleteVaultUser(params: DeleteVaultUserRequestParams): Promise<HttpResponse<DeleteVaultUserResponse>> {
    return this.httpService.delete(VaultUsersPaths.deleteVaultUser(params.vaultUuid, params.userUuid))
  }
}
