import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { VaultsServerInterface } from '@standardnotes/api'
import { VaultInterface, VaultInterfaceFromServerHash } from '@standardnotes/models'

export class UpdateServerVaultUseCase {
  constructor(private vaultsServer: VaultsServerInterface) {}

  async execute(params: {
    vaultUuid: string
    specifiedItemsKeyUuid: string
    vaultKeyTimestamp: number
  }): Promise<VaultInterface | ClientDisplayableError> {
    const response = await this.vaultsServer.updateVault({
      vaultUuid: params.vaultUuid,
      specifiedItemsKeyUuid: params.specifiedItemsKeyUuid,
      vaultKeyTimestamp: params.vaultKeyTimestamp,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return VaultInterfaceFromServerHash(response.data.vault)
  }
}
