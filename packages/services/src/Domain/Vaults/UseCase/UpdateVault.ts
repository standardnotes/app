import { ClientDisplayableError, VaultServerHash, isErrorResponse } from '@standardnotes/responses'
import { VaultsServerInterface } from '@standardnotes/api'

export class UpdateVaultUseCase {
  constructor(private vaultsServer: VaultsServerInterface) {}

  async execute(params: {
    vaultUuid: string
    specifiedItemsKeyUuid: string
    vaultKeyTimestamp: number
  }): Promise<VaultServerHash | ClientDisplayableError> {
    const response = await this.vaultsServer.updateVault({
      vaultUuid: params.vaultUuid,
      specifiedItemsKeyUuid: params.specifiedItemsKeyUuid,
      vaultKeyTimestamp: params.vaultKeyTimestamp,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.vault
  }
}
