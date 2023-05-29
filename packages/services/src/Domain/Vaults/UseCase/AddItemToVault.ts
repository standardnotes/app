import { SyncServiceInterface } from '@standardnotes/services'
import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { DecryptedItemInterface, FileItem } from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'
import { FilesClientInterface } from '@standardnotes/files'

export class AddItemToVaultUseCase {
  constructor(
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private files: FilesClientInterface,
  ) {}

  async execute(dto: { item: DecryptedItemInterface; vaultUuid: string }): Promise<ClientDisplayableError | void> {
    await this.items.changeItem(dto.item, (mutator) => {
      mutator.vault_uuid = dto.vaultUuid
    })

    await this.sync.sync()

    if (dto.item.content_type === ContentType.File) {
      await this.files.moveFileToVault(dto.item as FileItem, dto.vaultUuid)
    }
  }
}
