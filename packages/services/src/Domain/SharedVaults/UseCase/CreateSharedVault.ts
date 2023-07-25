import {
  KeySystemRootKeyStorageMode,
  SharedVaultListingInterface,
  VaultListingInterface,
  VaultListingMutator,
} from '@standardnotes/models'
import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { CreateVault } from '../../Vault/UseCase/CreateVault'
import { MoveItemsToVault } from '../../Vault/UseCase/MoveItemsToVault'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'

export class CreateSharedVault {
  constructor(
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private sharedVaultServer: SharedVaultServerInterface,
    private createVault: CreateVault,
    private moveItemsToVault: MoveItemsToVault,
  ) {}

  async execute(dto: {
    vaultName: string
    vaultDescription?: string
    userInputtedPassword: string | undefined
    storagePreference: KeySystemRootKeyStorageMode
  }): Promise<SharedVaultListingInterface | ClientDisplayableError> {
    const privateVault = await this.createVault.execute({
      vaultName: dto.vaultName,
      vaultDescription: dto.vaultDescription,
      userInputtedPassword: dto.userInputtedPassword,
      storagePreference: dto.storagePreference,
    })

    const serverResult = await this.sharedVaultServer.createSharedVault()
    if (isErrorResponse(serverResult)) {
      return ClientDisplayableError.FromString(`Failed to create shared vault ${JSON.stringify(serverResult)}`)
    }

    const serverVaultHash = serverResult.data.sharedVault

    const sharedVaultListing = await this.mutator.changeItem<VaultListingMutator, VaultListingInterface>(
      privateVault,
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
