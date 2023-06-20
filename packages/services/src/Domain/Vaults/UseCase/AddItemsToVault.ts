import { SyncServiceInterface } from '@standardnotes/services'
import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { DecryptedItemInterface, FileItem, VaultListingInterface } from '@standardnotes/models'
import { FilesClientInterface } from '@standardnotes/files'
import { ContentType } from '@standardnotes/common'

export class AddItemsToVaultUseCase {
  constructor(
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private files: FilesClientInterface,
  ) {}

  async execute(dto: {
    items: DecryptedItemInterface[]
    vault: VaultListingInterface
  }): Promise<ClientDisplayableError | void> {
    for (const item of dto.items) {
      await this.items.changeItem(item, (mutator) => {
        mutator.key_system_identifier = dto.vault.systemIdentifier
        mutator.shared_vault_uuid = dto.vault.isSharedVaultListing() ? dto.vault.sharing.sharedVaultUuid : undefined
      })
    }

    await this.sync.sync()

    for (const item of dto.items) {
      if (item.content_type === ContentType.File && dto.vault.isSharedVaultListing()) {
        await this.files.moveFileToSharedVault(item as FileItem, dto.vault)
      }
    }
  }
}
