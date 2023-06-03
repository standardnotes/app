import { isErrorResponse } from '@standardnotes/responses'
import { SharedVaultServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { RemoveSharedVaultItemsLocallyUseCase } from '../../Vaults/UseCase/RemoveSharedVaultItemsLocally'

export class ReloadRemovedUseCase {
  constructor(private sharedVault: SharedVaultServerInterface, private items: ItemManagerInterface) {}

  async execute(): Promise<void> {
    const response = await this.sharedVault.getRemovedSharedVaults()

    if (isErrorResponse(response)) {
      return
    }

    const removedSharedVaultIds = response.data.removedSharedVaults.map((removed) => removed.sharedVaultUuid)

    const removeItemsUseCase = new RemoveSharedVaultItemsLocallyUseCase(this.items)
    await removeItemsUseCase.execute({ sharedVaultUuids: removedSharedVaultIds })
  }
}
