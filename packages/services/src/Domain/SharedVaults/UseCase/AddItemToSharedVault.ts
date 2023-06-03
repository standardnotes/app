import { DecryptedItemInterface, FileItem, KeySystemIdentifier } from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'
import { FilesClientInterface } from '@standardnotes/files'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'

export class AddItemToSharedVaultUseCase {
  constructor(
    private sync: SyncServiceInterface,
    private files: FilesClientInterface,
    private items: ItemManagerInterface,
  ) {}

  async execute(dto: {
    item: DecryptedItemInterface
    keySystemIdentifier: KeySystemIdentifier
    sharedVaultUuid: string
  }): Promise<void> {
    await this.items.changeItem(dto.item, (mutator) => {
      mutator.shared_vault_uuid = dto.sharedVaultUuid
      mutator.key_system_identifier = dto.keySystemIdentifier
    })

    await this.sync.sync()

    if (dto.item.content_type === ContentType.File) {
      await this.files.moveFileToSharedVault(dto.item as FileItem, dto.sharedVaultUuid)
    }
  }
}
