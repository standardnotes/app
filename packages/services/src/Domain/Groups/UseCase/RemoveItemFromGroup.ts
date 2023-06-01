import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { DecryptedItemInterface, FileItem, PayloadEmitSource } from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'
import { FilesClientInterface } from '@standardnotes/files'
import { GroupServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class RemoveItemFromGroupUseCase {
  constructor(
    private groupServer: GroupServerInterface,
    private files: FilesClientInterface,
    private items: ItemManagerInterface,
  ) {}

  async execute(dto: { item: DecryptedItemInterface; groupUuid: string }): Promise<ClientDisplayableError | void> {
    const response = await this.groupServer.removeItemFromGroup({
      groupUuid: dto.groupUuid,
      itemUuid: dto.item.uuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromNetworkError(response)
    }

    await this.items.emitItemFromPayload(
      dto.item.payload.copy({
        group_uuid: undefined,
        updated_at: new Date(response.data.item.updated_at),
        updated_at_timestamp: response.data.item.updated_at_timestamp,
      }),
      PayloadEmitSource.RemoteRetrieved,
    )

    if (dto.item.content_type === ContentType.File) {
      await this.files.moveFileOutOfGroup(dto.item as FileItem)
    }
  }
}
