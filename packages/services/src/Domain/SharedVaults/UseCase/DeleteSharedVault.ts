import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { SharedVaultListingInterface } from '@standardnotes/models'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import { DeleteVaultUseCase } from '../../Vaults/UseCase/DeleteVault'
import { EncryptionProviderInterface } from '@standardnotes/encryption'

export class DeleteSharedVaultUseCase {
  constructor(
    private sharedVaultServer: SharedVaultServerInterface,
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private encryption: EncryptionProviderInterface,
  ) {}

  async execute(params: { sharedVault: SharedVaultListingInterface }): Promise<ClientDisplayableError | void> {
    const response = await this.sharedVaultServer.deleteSharedVault({
      sharedVaultUuid: params.sharedVault.sharing.sharedVaultUuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to delete vault ${response}`)
    }

    const deleteUsecase = new DeleteVaultUseCase(this.items, this.encryption)
    await deleteUsecase.execute(params.sharedVault)

    await this.sync.sync()
  }
}
