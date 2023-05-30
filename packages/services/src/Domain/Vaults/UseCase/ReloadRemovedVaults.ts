import { isErrorResponse } from '@standardnotes/responses'
import { VaultsServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { RemoveVaultItemsLocallyUseCase } from './RemoveVaultItemsLocally'

export class ReloadRemovedUseCase {
  constructor(private vaultServer: VaultsServerInterface, private items: ItemManagerInterface) {}

  async execute(): Promise<void> {
    const response = await this.vaultServer.getRemovedVaults()

    if (isErrorResponse(response)) {
      return
    }

    const removedVaultsIds = response.data.removedVaults.map((removed) => removed.vaultUuid)

    const removeItemsUseCase = new RemoveVaultItemsLocallyUseCase(this.items)
    await removeItemsUseCase.execute({ vaultUuids: removedVaultsIds })
  }
}
