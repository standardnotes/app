import { SyncServiceInterface } from '@standardnotes/services'
import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { DecryptedItemInterface, FileItem } from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'
import { FilesClientInterface } from '@standardnotes/files'

export class RemoveItemFromVault {
  constructor(
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private files: FilesClientInterface,
  ) {}

  async execute(dto: { item: DecryptedItemInterface }): Promise<ClientDisplayableError | void> {
    await this.items.changeItem(dto.item, (mutator) => {
      mutator.key_system_identifier = undefined
      mutator.shared_vault_uuid = undefined
    })

    await this.sync.sync()

    if (dto.item.content_type === ContentType.File) {
      await this.files.moveFileOutOfSharedVault(dto.item as FileItem)
    }
  }
}
