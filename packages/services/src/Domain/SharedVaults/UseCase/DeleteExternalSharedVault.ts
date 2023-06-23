import { SyncServiceInterface } from './../../Sync/SyncServiceInterface'
import { StorageServiceInterface } from '../../Storage/StorageServiceInterface'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { AnyItemInterface, VaultListingInterface } from '@standardnotes/models'
import { Uuids } from '@standardnotes/utils'

export class DeleteExternalSharedVaultUseCase {
  constructor(
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private storage: StorageServiceInterface,
    private sync: SyncServiceInterface,
  ) {}

  async execute(vault: VaultListingInterface): Promise<void> {
    await this.deleteDataSharedByVaultUsers(vault)
    await this.deleteDataOwnedByThisUser(vault)
    await this.encryption.keys.deleteNonPersistentSystemRootKeysForVault(vault.systemIdentifier)

    void this.sync.sync({ sourceDescription: 'Not awaiting due to this event handler running from sync response' })
  }

  /**
   * This data is shared with all vault users and does not belong to this particular user
   * The data will be removed locally without syncing the items
   */
  private async deleteDataSharedByVaultUsers(vault: VaultListingInterface): Promise<void> {
    const vaultItems = this.items
      .allTrackedItems()
      .filter((item) => item.key_system_identifier === vault.systemIdentifier)
    this.items.removeItemsLocally(vaultItems as AnyItemInterface[])

    const itemsKeys = this.encryption.keys.getKeySystemItemsKeys(vault.systemIdentifier)
    this.items.removeItemsLocally(itemsKeys)

    await this.storage.deletePayloadsWithUuids([...Uuids(vaultItems), ...Uuids(itemsKeys)])
  }

  private async deleteDataOwnedByThisUser(vault: VaultListingInterface): Promise<void> {
    const rootKeys = this.encryption.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)
    await this.items.setItemsToBeDeleted(rootKeys)

    await this.items.setItemToBeDeleted(vault)
  }
}
