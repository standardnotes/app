import { GetVaultItems } from './../../Vault/UseCase/GetVaultItems'
import { SharedVaultListingInterface, VaultListingInterface, VaultListingMutator } from '@standardnotes/models'
import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultServerInterface } from '@standardnotes/api'
import { MoveItemsToVault } from '../../Vault/UseCase/MoveItemsToVault'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'

export class ConvertToSharedVault {
  constructor(
    private mutator: MutatorClientInterface,
    private sharedVaultServer: SharedVaultServerInterface,
    private _moveItemsToVault: MoveItemsToVault,
    private _getVaultItems: GetVaultItems,
  ) {}

  async execute(dto: { vault: VaultListingInterface }): Promise<SharedVaultListingInterface | ClientDisplayableError> {
    if (dto.vault.isSharedVaultListing()) {
      throw new Error('Cannot convert a shared vault to a shared vault')
    }

    const serverResult = await this.sharedVaultServer.createSharedVault()
    if (isErrorResponse(serverResult)) {
      return ClientDisplayableError.FromString(`Failed to convert to shared vault ${JSON.stringify(serverResult)}`)
    }

    const serverVaultHash = serverResult.data.sharedVault

    const sharedVaultListing = await this.mutator.changeItem<VaultListingMutator, VaultListingInterface>(
      dto.vault,
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
