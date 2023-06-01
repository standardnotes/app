import { ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import { DecryptedItemInterface, FileItem } from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'
import { FilesClientInterface } from '@standardnotes/files'
import { GroupsServerInterface } from '@standardnotes/api'

export class RemoveItemFromGroupUseCase {
  constructor(private groupServer: GroupsServerInterface, private files: FilesClientInterface) {}

  async execute(dto: { item: DecryptedItemInterface; groupUuid: string }): Promise<ClientDisplayableError | void> {
    const result = await this.groupServer.removeItemFromGroup({
      groupUuid: dto.groupUuid,
      itemUuid: dto.item.uuid,
    })

    if (isClientDisplayableError(result)) {
      return result
    }

    if (dto.item.content_type === ContentType.File) {
      await this.files.moveFileOutOfGroup(dto.item as FileItem)
    }
  }
}
