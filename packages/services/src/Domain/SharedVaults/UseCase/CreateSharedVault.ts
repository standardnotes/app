import { SyncServiceInterface } from './../../Sync/SyncServiceInterface'
import {
  KeySystemRootKeyStorageMode,
  SharedVaultListingInterface,
  VaultListingInterface,
  VaultListingMutator,
} from '@standardnotes/models'
import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { SharedVaultServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { CreateVaultUseCase } from '../../Vaults/UseCase/CreateVault'
import { MoveItemsToVaultUseCase } from '../../Vaults/UseCase/MoveItemsToVault'
import { FilesClientInterface } from '@standardnotes/files'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'

export class CreateSharedVaultUseCase {
  constructor(
    private encryption: EncryptionProviderInterface,
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private files: FilesClientInterface,
    private sharedVaultServer: SharedVaultServerInterface,
  ) {}

  async execute(dto: {
    vaultName: string
    vaultDescription?: string
    userInputtedPassword: string | undefined
    storagePreference: KeySystemRootKeyStorageMode
  }): Promise<SharedVaultListingInterface | ClientDisplayableError> {
    const usecase = new CreateVaultUseCase(this.mutator, this.encryption, this.sync)
    const privateVault = await usecase.execute({
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
    const moveToVaultUsecase = new MoveItemsToVaultUseCase(this.mutator, this.sync, this.files)
    await moveToVaultUsecase.execute({ vault: sharedVaultListing, items: vaultItems })

    return sharedVaultListing as SharedVaultListingInterface
  }
}
