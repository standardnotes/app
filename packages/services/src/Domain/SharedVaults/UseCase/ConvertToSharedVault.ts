import { SharedVaultListingInterface, VaultListingInterface, VaultListingMutator } from '@standardnotes/models'
import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { MoveItemsToVault } from '../../Vaults/UseCase/MoveItemsToVault'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'

export class ConvertToSharedVault {
  constructor(
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private sharedVaultServer: SharedVaultServerInterface,
    private moveItemsToVault: MoveItemsToVault,
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

    await this.moveItemsToVault.execute({ vault: sharedVaultListing, items: vaultItems })

    return sharedVaultListing as SharedVaultListingInterface
  }
}
