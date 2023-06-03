import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { DecryptedItemInterface, FileItem, PayloadEmitSource } from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'
import { FilesClientInterface } from '@standardnotes/files'
import { SharedVaultServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class AddItemToSharedVaultUseCase {
  constructor(
    private sharedVault: SharedVaultServerInterface,
    private files: FilesClientInterface,
    private items: ItemManagerInterface,
  ) {}

  async execute(dto: { item: DecryptedItemInterface; sharedVaultUuid: string }): Promise<ClientDisplayableError | void> {
    const response = await this.sharedVault.addItemToSharedVault({
      sharedVaultUuid: dto.sharedVaultUuid,
      itemUuid: dto.item.uuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromNetworkError(response)
    }

    await this.items.emitItemFromPayload(
      dto.item.payload.copy({
        shared_vault_uuid: dto.sharedVaultUuid,
        updated_at: new Date(response.data.item.updated_at),
        updated_at_timestamp: response.data.item.updated_at_timestamp,
      }),
      PayloadEmitSource.RemoteRetrieved,
    )

    if (dto.item.content_type === ContentType.File) {
      await this.files.moveFileToSharedVault(dto.item as FileItem, dto.sharedVaultUuid)
    }
  }
}
