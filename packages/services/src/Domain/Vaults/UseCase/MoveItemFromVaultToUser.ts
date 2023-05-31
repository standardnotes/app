import { SyncServiceInterface } from '@standardnotes/services'
import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { DecryptedItemInterface, FileItem } from '@standardnotes/models'
import { FilesClientInterface } from '@standardnotes/files'
import { ContentType } from '@standardnotes/common'

export class MoveItemFromVaultToUser {
  constructor(
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private files: FilesClientInterface,
  ) {}

  async execute(dto: { item: DecryptedItemInterface }): Promise<ClientDisplayableError | void> {
    await this.items.changeItem(dto.item, (mutator) => {
      mutator.vault_system_identifier = undefined
    })

    await this.sync.sync()

    if (dto.item.content_type === ContentType.File) {
      await this.files.moveFileFromVaultToUser(dto.item as FileItem)
    }
  }
}
