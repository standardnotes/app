import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { SharedVaultServerInterface } from './SharedVaultServerInterface'
import { CreateSharedVaultParams } from '../../Request/SharedVault/CreateSharedVaultParams'
import { SharedVaultsPaths } from './Paths'
import { CreateSharedVaultResponse } from '../../Response/SharedVault/CreateSharedVaultResponse'
import { GetSharedVaultsResponse } from '../../Response/SharedVault/GetSharedVaultsResponse'
import { CreateSharedVaultValetTokenResponse } from '../../Response/SharedVault/CreateSharedVaultValetTokenResponse'
import { CreateSharedVaultValetTokenParams } from '../../Request/SharedVault/CreateSharedVaultValetTokenParams'

export class SharedVaultServer implements SharedVaultServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  getSharedVaults(): Promise<HttpResponse<GetSharedVaultsResponse>> {
    return this.httpService.get(SharedVaultsPaths.getSharedVaults)
  }

  createSharedVault(params: CreateSharedVaultParams): Promise<HttpResponse<CreateSharedVaultResponse>> {
    return this.httpService.post(SharedVaultsPaths.createSharedVault, {
      key_system_identifier: params.keySystemIdentifier,
    })
  }

  deleteSharedVault(params: { sharedVaultUuid: string }): Promise<HttpResponse<boolean>> {
    return this.httpService.delete(SharedVaultsPaths.deleteSharedVault(params.sharedVaultUuid))
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
}
