import { isErrorResponse } from '@standardnotes/responses'
import { VaultsServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { AnyItemInterface } from '@standardnotes/models'

export class ReloadRemovedUseCase {
  constructor(private vaultServer: VaultsServerInterface, private items: ItemManagerInterface) {}

  async execute(): Promise<void> {
    const response = await this.vaultServer.getRemovedVaults()

    if (isErrorResponse(response)) {
      return
    }

    const removedVaultsIds = response.data.removedVaults.map((removed) => removed.vaultUuid)
    this.removeDataPertainingToRemovedVaults(removedVaultsIds)
  }

  private removeDataPertainingToRemovedVaults(vaultUuids: string[]): void {
    const items = this.items.allTrackedItems()
    const itemsToRemove = items.filter((item) => item.vault_uuid && vaultUuids.includes(item.vault_uuid))
    this.items.removeItemsLocally(itemsToRemove as AnyItemInterface[])
  }
}
