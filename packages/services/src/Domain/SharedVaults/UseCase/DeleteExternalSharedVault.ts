import { SyncServiceInterface } from './../../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { AnyItemInterface, VaultListingInterface } from '@standardnotes/models'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'
import { DiscardItemsLocally } from '../../UseCase/DiscardItemsLocally'
import { KeySystemKeyManagerInterface } from '../../KeySystem/KeySystemKeyManagerInterface'

export class DeleteThirdPartyVault {
  constructor(
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private keys: KeySystemKeyManagerInterface,
    private sync: SyncServiceInterface,
    private _discardItemsLocally: DiscardItemsLocally,
  ) {}

  async execute(vault: VaultListingInterface): Promise<void> {
    await this.deleteDataSharedByVaultUsers(vault)
    await this.deleteDataOwnedByThisUser(vault)
    await this.keys.deleteNonPersistentSystemRootKeysForVault(vault.systemIdentifier)

    void this.sync.sync({ sourceDescription: 'Not awaiting due to this event handler running from sync response' })
  }

  /**
   * This data is shared with all vault users and does not belong to this particular user
   * The data will be removed locally without syncing the items
   */
  private async deleteDataSharedByVaultUsers(vault: VaultListingInterface): Promise<void> {
    const vaultItems = <AnyItemInterface[]>(
      this.items.allTrackedItems().filter((item) => item.key_system_identifier === vault.systemIdentifier)
    )

    const itemsKeys = this.keys.getKeySystemItemsKeys(vault.systemIdentifier)

    await this._discardItemsLocally.execute([...vaultItems, ...itemsKeys])
  }

  private async deleteDataOwnedByThisUser(vault: VaultListingInterface): Promise<void> {
    const rootKeys = this.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)
    await this.mutator.setItemsToBeDeleted(rootKeys)

    await this.mutator.setItemToBeDeleted(vault)
  }
}
