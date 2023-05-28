import { HttpResponse } from '@standardnotes/responses'
import { GetVaultUsersRequestParams } from '../../Request/VaultUser/GetVaultUsersRequestParams'
import { DeleteVaultUserRequestParams } from '../../Request/VaultUser/DeleteVaultUserRequestParams'
import { DeleteVaultUserResponse } from '../../Response/VaultUsers/DeleteVaultUserResponse'
import { GetVaultUsersResponse } from '../../Response/VaultUsers/GetVaultUsersResponse'

export interface VaultUsersServerInterface {
  getVaultUsers(params: GetVaultUsersRequestParams): Promise<HttpResponse<GetVaultUsersResponse>>

  deleteVaultUser(params: DeleteVaultUserRequestParams): Promise<HttpResponse<DeleteVaultUserResponse>>
}
