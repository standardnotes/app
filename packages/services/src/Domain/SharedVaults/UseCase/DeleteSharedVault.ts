import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultServerInterface } from '@standardnotes/api'
import { SharedVaultListingInterface } from '@standardnotes/models'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import { DeleteVault } from '../../Vault/UseCase/DeleteVault'

export class DeleteSharedVault {
  constructor(
    private sharedVaultServer: SharedVaultServerInterface,
    private sync: SyncServiceInterface,
    private deleteVault: DeleteVault,
  ) {}

  async execute(params: { sharedVault: SharedVaultListingInterface }): Promise<ClientDisplayableError | void> {
    const response = await this.sharedVaultServer.deleteSharedVault({
      sharedVaultUuid: params.sharedVault.sharing.sharedVaultUuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to delete vault ${JSON.stringify(response)}`)
    }

    await this.deleteVault.execute(params.sharedVault)

    await this.sync.sync()
  }
}
