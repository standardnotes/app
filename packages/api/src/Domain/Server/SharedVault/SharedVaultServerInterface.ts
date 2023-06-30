import { HttpResponse } from '@standardnotes/responses'
import { CreateSharedVaultResponse } from '../../Response/SharedVault/CreateSharedVaultResponse'

import { GetSharedVaultsResponse } from '../../Response/SharedVault/GetSharedVaultsResponse'
import { CreateSharedVaultValetTokenResponse } from '../../Response/SharedVault/CreateSharedVaultValetTokenResponse'
import { CreateSharedVaultValetTokenParams } from '../../Request/SharedVault/CreateSharedVaultValetTokenParams'

export interface SharedVaultServerInterface {
  getSharedVaults(): Promise<HttpResponse<GetSharedVaultsResponse>>

  createSharedVault(): Promise<HttpResponse<CreateSharedVaultResponse>>
  deleteSharedVault(params: { sharedVaultUuid: string }): Promise<HttpResponse<boolean>>

  createSharedVaultFileValetToken(
    params: CreateSharedVaultValetTokenParams,
  ): Promise<HttpResponse<CreateSharedVaultValetTokenResponse>>
}
