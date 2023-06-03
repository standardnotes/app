import { HttpResponse } from '@standardnotes/responses'
import { CreateSharedVaultResponse } from '../../Response/SharedVault/CreateSharedVaultResponse'
import { CreateSharedVaultParams } from '../../Request/SharedVault/CreateSharedVaultParams'
import { UpdateSharedVaultParams } from '../../Request/SharedVault/UpdateSharedVaultParams'
import { UpdateSharedVaultResponse } from '../../Response/SharedVault/UpdateSharedVaultResponse'
import { GetSharedVaultsResponse } from '../../Response/SharedVault/GetSharedVaultsResponse'
import { CreateSharedVaultValetTokenResponse } from '../../Response/SharedVault/CreateSharedVaultValetTokenResponse'
import { CreateSharedVaultValetTokenParams } from '../../Request/SharedVault/CreateSharedVaultValetTokenParams'
import { GetRemovedSharedVaultsResponse } from '../../Response/SharedVault/GetRemovedSharedVaults'
import { AddItemToSharedVaultRequestParams } from '../../Request/SharedVault/AddItemToSharedVault'
import { AddItemToSharedVaultResponse } from '../../Response/SharedVault/AddItemToSharedVaultResponse'
import { RemoveItemFromSharedVaultParams } from '../../Request/SharedVault/RemoveItemFromSharedVault'
import { RemoveItemFromSharedVaultResponse } from '../../Response/SharedVault/RemoveItemFromSharedVaultResponse'

export interface SharedVaultServerInterface {
  getSharedVaults(): Promise<HttpResponse<GetSharedVaultsResponse>>
  getRemovedSharedVaults(): Promise<HttpResponse<GetRemovedSharedVaultsResponse>>

  createSharedVault(params: CreateSharedVaultParams): Promise<HttpResponse<CreateSharedVaultResponse>>
  updateSharedVault(params: UpdateSharedVaultParams): Promise<HttpResponse<UpdateSharedVaultResponse>>
  deleteSharedVault(params: { sharedVaultUuid: string }): Promise<HttpResponse<boolean>>

  addItemToSharedVault(params: AddItemToSharedVaultRequestParams): Promise<HttpResponse<AddItemToSharedVaultResponse>>
  removeItemFromSharedVault(params: RemoveItemFromSharedVaultParams): Promise<HttpResponse<RemoveItemFromSharedVaultResponse>>

  createSharedVaultFileValetToken(params: CreateSharedVaultValetTokenParams): Promise<HttpResponse<CreateSharedVaultValetTokenResponse>>
}
