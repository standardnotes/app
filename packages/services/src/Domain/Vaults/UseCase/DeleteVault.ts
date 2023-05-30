import { ClientDisplayableError } from '@standardnotes/responses'
import { VaultsServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { DecryptedItemInterface } from '@standardnotes/models'

export class DeleteVaultUseCase {
  constructor(private items: ItemManagerInterface, private vaultsServer: VaultsServerInterface) {}

  async execute(dto: { vaultUuid: string }): Promise<ClientDisplayableError | void> {
    const response = await this.vaultsServer.deleteVault({ vaultUuid: dto.vaultUuid })

    if (!response) {
      return ClientDisplayableError.FromString('Failed to delete vault')
    }

    await this.deleteVaultItemsKeysForVault(dto.vaultUuid)

    const vaultItems = this.items.itemsBelongingToVault(dto.vaultUuid)

    await this.removeVaultFromItems(vaultItems)
  }

  async deleteVaultItemsKeysForVault(vaultUuid: string): Promise<void> {
    const vaultItemsKeys = this.items.getVaultItemsKeysForVault(vaultUuid)

    await this.removeVaultFromItems(vaultItemsKeys)

    await this.items.setItemsToBeDeleted(vaultItemsKeys)
  }

  async removeVaultFromItems(items: DecryptedItemInterface[]): Promise<void> {
    await this.items.setItemsToBeDeleted(items)
  }
}
