import { GetVaultItems } from './../../Vault/UseCase/GetVaultItems'
import {
  EmojiString,
  IconType,
  KeySystemRootKeyStorageMode,
  SharedVaultListingInterface,
  VaultListingInterface,
  VaultListingMutator,
} from '@standardnotes/models'
import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultServerInterface } from '@standardnotes/api'
import { CreateVault } from '../../Vault/UseCase/CreateVault'
import { MoveItemsToVault } from '../../Vault/UseCase/MoveItemsToVault'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'

export class CreateSharedVault {
  constructor(
    private mutator: MutatorClientInterface,
    private sharedVaultServer: SharedVaultServerInterface,
    private _createVault: CreateVault,
    private _moveItemsToVault: MoveItemsToVault,
    private _getVaultItems: GetVaultItems,
  ) {}

  async execute(dto: {
    vaultName: string
    vaultDescription?: string
    vaultIcon: IconType | EmojiString
    userInputtedPassword: string | undefined
    storagePreference: KeySystemRootKeyStorageMode
  }): Promise<SharedVaultListingInterface | ClientDisplayableError> {
    const privateVault = await this._createVault.execute({
      vaultName: dto.vaultName,
      vaultDescription: dto.vaultDescription,
      vaultIcon: dto.vaultIcon,
      userInputtedPassword: dto.userInputtedPassword,
      storagePreference: dto.storagePreference,
    })

    const serverResult = await this.sharedVaultServer.createSharedVault()
    if (isErrorResponse(serverResult)) {
      return ClientDisplayableError.FromString(`Failed to create shared vault: ${serverResult.data.error?.message}`)
    }

    const serverVaultHash = serverResult.data.sharedVault

    const sharedVaultListing = await this.mutator.changeItem<VaultListingMutator, VaultListingInterface>(
      privateVault,
      (mutator) => {
        mutator.sharing = {
          sharedVaultUuid: serverVaultHash.uuid,
          ownerUserUuid: serverVaultHash.user_uuid,
          fileBytesUsed: serverVaultHash.file_upload_bytes_used,
          designatedSurvivor: null,
        }
      },
    )

    const vaultItems = this._getVaultItems.execute(sharedVaultListing).getValue()

    await this._moveItemsToVault.execute({ vault: sharedVaultListing, items: vaultItems })

    return sharedVaultListing as SharedVaultListingInterface
  }
}
