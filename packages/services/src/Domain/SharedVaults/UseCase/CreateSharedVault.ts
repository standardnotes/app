import { SyncServiceInterface } from './../../Sync/SyncServiceInterface'
import {
  KeySystemRootKeyStorageType,
  SharedVaultListingInterface,
  VaultListingInterface,
  VaultListingMutator,
} from '@standardnotes/models'
import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { SharedVaultServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { CreateVaultUseCase } from '../../Vaults/UseCase/CreateVault'
import { AddItemToVaultUseCase } from '../../Vaults/UseCase/AddItemToVault'
import { FilesClientInterface } from '@standardnotes/files'

export class CreateSharedVaultUseCase {
  constructor(
    private encryption: EncryptionProviderInterface,
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private files: FilesClientInterface,
    private sharedVaultServer: SharedVaultServerInterface,
  ) {}

  async execute(dto: {
    vaultName: string
    vaultDescription?: string
    userInputtedPassword: string | undefined
    storagePreference: KeySystemRootKeyStorageType
  }): Promise<SharedVaultListingInterface | ClientDisplayableError> {
    const usecase = new CreateVaultUseCase(this.items, this.encryption, this.sync)
    const privateVault = await usecase.execute({
      vaultName: dto.vaultName,
      vaultDescription: dto.vaultDescription,
      userInputtedPassword: dto.userInputtedPassword,
      storagePreference: dto.storagePreference,
    })

    const serverResult = await this.sharedVaultServer.createSharedVault({
      keySystemIdentifier: privateVault.systemIdentifier,
    })

    if (isErrorResponse(serverResult)) {
      return ClientDisplayableError.FromString(`Failed to create shared vault ${serverResult}`)
    }

    const serverVaultHash = serverResult.data.sharedVault

    const sharedVaultListing = await this.items.changeItem<VaultListingMutator, VaultListingInterface>(
      privateVault,
      (mutator) => {
        mutator.sharing = {
          sharedVaultUuid: serverVaultHash.uuid,
          ownerUserUuid: serverVaultHash.user_uuid,
        }
      },
    )

    const vaultItems = this.items.itemsBelongingToKeySystem(sharedVaultListing.systemIdentifier)
    const addToVaultUsecase = new AddItemToVaultUseCase(this.items, this.sync, this.files)
    for (const item of vaultItems) {
      await addToVaultUsecase.execute({ vault: sharedVaultListing, item })
    }

    return sharedVaultListing as SharedVaultListingInterface
  }
}
