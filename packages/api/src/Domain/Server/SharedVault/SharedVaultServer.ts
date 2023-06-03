import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { SharedVaultServerInterface } from './SharedVaultServerInterface'
import { CreateSharedVaultParams } from '../../Request/SharedVault/CreateSharedVaultParams'
import { SharedVaultsPaths } from './Paths'
import { CreateSharedVaultResponse } from '../../Response/SharedVault/CreateSharedVaultResponse'
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

export class SharedVaultServer implements SharedVaultServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  getSharedVaults(): Promise<HttpResponse<GetSharedVaultsResponse>> {
    return this.httpService.get(SharedVaultsPaths.getSharedVaults)
  }

  createSharedVault(params: CreateSharedVaultParams): Promise<HttpResponse<CreateSharedVaultResponse>> {
    return this.httpService.post(SharedVaultsPaths.createSharedVault, {
      key_system_identifier: params.keySystemIdentifier,
      specified_items_key_uuid: params.specifiedItemsKeyUuid,
    })
  }

  deleteSharedVault(params: { sharedVaultUuid: string }): Promise<HttpResponse<boolean>> {
    return this.httpService.delete(SharedVaultsPaths.deleteSharedVault(params.sharedVaultUuid))
  }

  updateSharedVault(params: UpdateSharedVaultParams): Promise<HttpResponse<UpdateSharedVaultResponse>> {
    return this.httpService.patch(SharedVaultsPaths.updateSharedVault(params.sharedVaultUuid), {
      specified_items_key_uuid: params.specifiedItemsKeyUuid,
    })
  }

  createSharedVaultFileValetToken(
    params: CreateSharedVaultValetTokenParams,
  ): Promise<HttpResponse<CreateSharedVaultValetTokenResponse>> {
    return this.httpService.post(SharedVaultsPaths.createSharedVaultFileValetToken(params.sharedVaultUuid), {
      file_uuid: params.fileUuid,
      remote_identifier: params.remoteIdentifier,
      operation: params.operation,
      unencrypted_file_size: params.unencryptedFileSize,
      move_operation_type: params.moveOperationType,
      shared_vault_to_shared_vault_move_target_uuid: params.sharedVaultToSharedVaultMoveTargetUuid,
    })
  }

  getRemovedSharedVaults(): Promise<HttpResponse<GetRemovedSharedVaultsResponse>> {
    return this.httpService.get(SharedVaultsPaths.getRemovedSharedVaults)
  }

  addItemToSharedVault(params: AddItemToSharedVaultRequestParams): Promise<HttpResponse<AddItemToSharedVaultResponse>> {
    return this.httpService.post(SharedVaultsPaths.addItemToSharedVault(params.sharedVaultUuid), {
      item_uuid: params.itemUuid,
    })
  }

  removeItemFromSharedVault(
    params: RemoveItemFromSharedVaultParams,
  ): Promise<HttpResponse<RemoveItemFromSharedVaultResponse>> {
    return this.httpService.delete(SharedVaultsPaths.removeItemFromSharedVault(params.sharedVaultUuid), {
      item_uuid: params.itemUuid,
    })
  }
}
