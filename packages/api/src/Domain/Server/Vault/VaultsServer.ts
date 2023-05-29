import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { VaultsServerInterface } from './VaultsServerInterface'
import { CreateVaultParams } from '../../Request/Vault/CreateVaultParams'
import { VaultsPaths } from './Paths'
import { CreateVaultResponse } from '../../Response/Vault/CreateVaultResponse'
import { UpdateVaultParams } from '../../Request/Vault/UpdateVaultParams'
import { UpdateVaultResponse } from '../../Response/Vault/UpdateVaultResponse'
import { GetVaultsResponse } from '../../Response/Vault/GetVaultsResponse'
import { CreateVaultValetTokenResponse } from '../../Response/Vault/CreateVaultValetTokenResponse'
import { CreateVaultValetTokenParams } from '../../Request/Vault/CreateVaultValetTokenParams'

export class VaultsServer implements VaultsServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  getVaults(): Promise<HttpResponse<GetVaultsResponse>> {
    return this.httpService.get(VaultsPaths.getVaults)
  }

  createVault(params: CreateVaultParams): Promise<HttpResponse<CreateVaultResponse>> {
    return this.httpService.post(VaultsPaths.createVault, {
      vault_uuid: params.vaultUuid,
      specified_items_key_uuid: params.specifiedItemsKeyUuid,
      vault_key_timestamp: params.vaultKeyTimestamp,
    })
  }

  deleteVault(params: { vaultUuid: string }): Promise<HttpResponse<boolean>> {
    return this.httpService.delete(VaultsPaths.deleteVault(params.vaultUuid))
  }

  updateVault(params: UpdateVaultParams): Promise<HttpResponse<UpdateVaultResponse>> {
    return this.httpService.patch(VaultsPaths.updateVault(params.vaultUuid), {
      specified_items_key_uuid: params.specifiedItemsKeyUuid,
      vault_key_timestamp: params.vaultKeyTimestamp,
    })
  }

  createVaultFileValetToken(params: CreateVaultValetTokenParams): Promise<HttpResponse<CreateVaultValetTokenResponse>> {
    return this.httpService.post(VaultsPaths.createVaultFileValetToken(params.vaultUuid), {
      file_uuid: params.fileUuid,
      remote_identifier: params.remoteIdentifier,
      operation: params.operation,
      unencrypted_file_size: params.unencryptedFileSize,
    })
  }
}
