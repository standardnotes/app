import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { VaultUsersServerInterface } from '@standardnotes/api'
import { RemoveVaultItemsLocallyUseCase } from '../../Vaults/UseCase/RemoveVaultItemsLocally'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class LeaveVaultUseCase {
  constructor(private vaultUserServer: VaultUsersServerInterface, private items: ItemManagerInterface) {}

  async execute(params: { vaultUuid: string; userUuid: string }): Promise<ClientDisplayableError | void> {
    const response = await this.vaultUserServer.deleteVaultUser({
      vaultUuid: params.vaultUuid,
      userUuid: params.userUuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to leave vault ${response}`)
    }

    const removeLocalItems = new RemoveVaultItemsLocallyUseCase(this.items)
    await removeLocalItems.execute({ vaultUuids: [params.vaultUuid] })
  }
}
