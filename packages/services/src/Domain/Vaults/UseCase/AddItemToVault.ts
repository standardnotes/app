import { SyncServiceInterface } from '@standardnotes/services'
import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { DecryptedItemInterface, FileItem } from '@standardnotes/models'
import { VaultDisplayListing, isSharedVaultDisplayListing } from '../VaultDisplayListing'
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
    vault: VaultDisplayListing
  }): Promise<ClientDisplayableError | void> {
    await this.items.changeItem(dto.item, (mutator) => {
      mutator.key_system_identifier = dto.vault.systemIdentifier
      mutator.shared_vault_uuid = isSharedVaultDisplayListing(dto.vault) ? dto.vault.sharedVaultUuid : undefined
    })

    await this.sync.sync()

    if (dto.item.content_type === ContentType.File && isSharedVaultDisplayListing(dto.vault)) {
      await this.files.moveFileToSharedVault(dto.item as FileItem, dto.vault.sharedVaultUuid)
    }
  }
}
