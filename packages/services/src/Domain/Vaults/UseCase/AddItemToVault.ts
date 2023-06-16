import { SyncServiceInterface } from '@standardnotes/services'
import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { DecryptedItemInterface, FileItem, VaultListingInterface } from '@standardnotes/models'
import { FilesClientInterface } from '@standardnotes/files'
import { ContentType } from '@standardnotes/common'

export class AddItemToVaultUseCase {
  constructor(
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private files: FilesClientInterface,
  ) {}

  async execute(dto: {
    item: DecryptedItemInterface
    vault: VaultListingInterface
  }): Promise<ClientDisplayableError | void> {
    await this.items.changeItem(dto.item, (mutator) => {
      mutator.key_system_identifier = dto.vault.systemIdentifier
      mutator.shared_vault_uuid = dto.vault.isSharedVaultListing() ? dto.vault.sharing.sharedVaultUuid : undefined
    })

    await this.sync.sync()

    if (dto.item.content_type === ContentType.File && dto.vault.isSharedVaultListing()) {
      await this.files.moveFileToSharedVault(dto.item as FileItem, dto.vault)
    }
  }
}
