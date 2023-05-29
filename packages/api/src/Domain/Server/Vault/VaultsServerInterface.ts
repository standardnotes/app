import { HttpResponse } from '@standardnotes/responses'
import { CreateVaultResponse } from '../../Response/Vault/CreateVaultResponse'
import { CreateVaultParams } from '../../Request/Vault/CreateVaultParams'
import { UpdateVaultParams } from '../../Request/Vault/UpdateVaultParams'
import { UpdateVaultResponse } from '../../Response/Vault/UpdateVaultResponse'
import { GetVaultsResponse } from '../../Response/Vault/GetVaultsResponse'
import { CreateVaultValetTokenResponse } from '../../Response/Vault/CreateVaultValetTokenResponse'
import { CreateVaultValetTokenParams } from '../../Request/Vault/CreateVaultValetTokenParams'

export interface VaultsServerInterface {
  getVaults(): Promise<HttpResponse<GetVaultsResponse>>

  createVault(params: CreateVaultParams): Promise<HttpResponse<CreateVaultResponse>>

  updateVault(params: UpdateVaultParams): Promise<HttpResponse<UpdateVaultResponse>>

  deleteVault(params: { vaultUuid: string }): Promise<HttpResponse<boolean>>

  createVaultFileValetToken(params: CreateVaultValetTokenParams): Promise<HttpResponse<CreateVaultValetTokenResponse>>
}
