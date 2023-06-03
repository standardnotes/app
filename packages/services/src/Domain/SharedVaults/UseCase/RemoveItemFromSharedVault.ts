import { DecryptedItemInterface, FileItem } from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'
import { FilesClientInterface } from '@standardnotes/files'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'

export class RemoveItemFromSharedVaultUseCase {
  constructor(
    private sync: SyncServiceInterface,
    private files: FilesClientInterface,
    private items: ItemManagerInterface,
  ) {}

  async execute(dto: { item: DecryptedItemInterface }): Promise<void> {
    await this.items.changeItem(dto.item, (mutator) => {
      mutator.shared_vault_uuid = undefined
      mutator.key_system_identifier = undefined
    })

    await this.sync.sync()

    if (dto.item.content_type === ContentType.File) {
      await this.files.moveFileOutOfSharedVault(dto.item as FileItem)
    }
  }
}
