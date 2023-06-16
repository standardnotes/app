import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { SharedVaultListingInterface } from '@standardnotes/models'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'

export class DeleteSharedVaultUseCase {
  constructor(
    private sharedVaultServer: SharedVaultServerInterface,
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
  ) {}

  async execute(params: { sharedVault: SharedVaultListingInterface }): Promise<ClientDisplayableError | void> {
    const response = await this.sharedVaultServer.deleteSharedVault({
      sharedVaultUuid: params.sharedVault.sharing.sharedVaultUuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to delete vault ${response}`)
    }

    const vaultItems = this.items.itemsBelongingToKeySystem(params.sharedVault.systemIdentifier)
    await this.items.setItemsToBeDeleted(vaultItems)

    await this.sync.sync()
  }
}
