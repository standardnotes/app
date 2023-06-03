import { HttpResponse } from '@standardnotes/responses'
import { CreateSharedVaultResponse } from '../../Response/SharedVault/CreateSharedVaultResponse'
import { CreateSharedVaultParams } from '../../Request/SharedVault/CreateSharedVaultParams'
import { UpdateSharedVaultParams } from '../../Request/SharedVault/UpdateSharedVaultParams'
import { UpdateSharedVaultResponse } from '../../Response/SharedVault/UpdateSharedVaultResponse'
import { GetSharedVaultsResponse } from '../../Response/SharedVault/GetSharedVaultsResponse'
import { CreateSharedVaultValetTokenResponse } from '../../Response/SharedVault/CreateSharedVaultValetTokenResponse'
import { CreateSharedVaultValetTokenParams } from '../../Request/SharedVault/CreateSharedVaultValetTokenParams'

export interface SharedVaultServerInterface {
  getSharedVaults(): Promise<HttpResponse<GetSharedVaultsResponse>>

  createSharedVault(params: CreateSharedVaultParams): Promise<HttpResponse<CreateSharedVaultResponse>>
  updateSharedVault(params: UpdateSharedVaultParams): Promise<HttpResponse<UpdateSharedVaultResponse>>
  deleteSharedVault(params: { sharedVaultUuid: string }): Promise<HttpResponse<boolean>>

  createSharedVaultFileValetToken(
    params: CreateSharedVaultValetTokenParams,
  ): Promise<HttpResponse<CreateSharedVaultValetTokenResponse>>
}
