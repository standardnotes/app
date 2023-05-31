import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { GroupsServerInterface } from '@standardnotes/api'
import { VaultInterface, VaultInterfaceFromServerHash } from '@standardnotes/models'

export class UpdateServerVaultUseCase {
  constructor(private vaultsServer: GroupsServerInterface) {}

  async execute(params: {
    vaultSystemIdentifier: string
    specifiedItemsKeyUuid: string
    vaultKeyTimestamp: number
  }): Promise<VaultInterface | ClientDisplayableError> {
    const response = await this.vaultsServer.updateVault({
      vaultSystemIdentifier: params.vaultUuid,
      specifiedItemsKeyUuid: params.specifiedItemsKeyUuid,
      vaultKeyTimestamp: params.vaultKeyTimestamp,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return VaultInterfaceFromServerHash(response.data.vault)
  }
}
