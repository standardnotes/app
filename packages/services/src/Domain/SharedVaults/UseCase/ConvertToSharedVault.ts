import { SyncServiceInterface } from './../../Sync/SyncServiceInterface'
import { SharedVaultListingInterface, VaultListingInterface, VaultListingMutator } from '@standardnotes/models'
import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { MoveItemsToVaultUseCase } from '../../Vaults/UseCase/MoveItemsToVault'
import { FilesClientInterface } from '@standardnotes/files'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'

export class ConvertToSharedVaultUseCase {
  constructor(
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private files: FilesClientInterface,
    private sharedVaultServer: SharedVaultServerInterface,
  ) {}

  async execute(dto: { vault: VaultListingInterface }): Promise<SharedVaultListingInterface | ClientDisplayableError> {
    if (dto.vault.isSharedVaultListing()) {
      throw new Error('Cannot convert a shared vault to a shared vault')
    }

    const serverResult = await this.sharedVaultServer.createSharedVault()
    if (isErrorResponse(serverResult)) {
      return ClientDisplayableError.FromString(`Failed to create shared vault ${serverResult}`)
    }

    const serverVaultHash = serverResult.data.sharedVault

    const sharedVaultListing = await this.mutator.changeItem<VaultListingMutator, VaultListingInterface>(
      dto.vault,
      (mutator) => {
        mutator.sharing = {
          sharedVaultUuid: serverVaultHash.uuid,
          ownerUserUuid: serverVaultHash.user_uuid,
        }
      },
    )

    const vaultItems = this.items.itemsBelongingToKeySystem(sharedVaultListing.systemIdentifier)
    const moveToVaultUsecase = new MoveItemsToVaultUseCase(this.mutator, this.sync, this.files)
    await moveToVaultUsecase.execute({ vault: sharedVaultListing, items: vaultItems })

    return sharedVaultListing as SharedVaultListingInterface
  }
}
