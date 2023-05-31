import { ClientDisplayableError } from '@standardnotes/responses'
import { GroupsServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { DecryptedItemInterface } from '@standardnotes/models'

export class DeleteVaultUseCase {
  constructor(private items: ItemManagerInterface, private vaultsServer: GroupsServerInterface) {}

  async execute(dto: { vaultSystemIdentifier: string }): Promise<ClientDisplayableError | void> {
    const response = await this.vaultsServer.deleteVault({ vaultSystemIdentifier: dto.vaultUuid })

    if (!response) {
      return ClientDisplayableError.FromString('Failed to delete vault')
    }

    await this.deleteVaultItemsKeysForVault(dto.vaultUuid)

    const vaultItems = this.items.itemsBelongingToVaultSystem(dto.vaultUuid)

    await this.removeVaultFromItems(vaultItems)
  }

  async deleteVaultItemsKeysForVault(vaultSystemIdentifier: string): Promise<void> {
    const vaultItemsKeys = this.items.getAllVaultItemsKeysForVault(vaultUuid)

    await this.removeVaultFromItems(vaultItemsKeys)

    await this.items.setItemsToBeDeleted(vaultItemsKeys)
  }

  async removeVaultFromItems(items: DecryptedItemInterface[]): Promise<void> {
    await this.items.setItemsToBeDeleted(items)
  }
}
