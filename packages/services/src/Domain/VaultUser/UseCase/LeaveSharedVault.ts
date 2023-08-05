import { UserServiceInterface } from './../../User/UserServiceInterface'
import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultUsersServerInterface } from '@standardnotes/api'
import { DeleteThirdPartyVault } from '../../SharedVaults/UseCase/DeleteExternalSharedVault'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { SharedVaultListingInterface } from '@standardnotes/models'

export class LeaveVault {
  constructor(
    private users: UserServiceInterface,
    private vaultUserServer: SharedVaultUsersServerInterface,
    private items: ItemManagerInterface,
    private _deleteThirdPartyVault: DeleteThirdPartyVault,
  ) {}

  async execute(params: { sharedVault: SharedVaultListingInterface }): Promise<ClientDisplayableError | void> {
    const latestVaultListing = this.items.findItem<SharedVaultListingInterface>(params.sharedVault.uuid)
    if (!latestVaultListing) {
      throw new Error(`LeaveVaultUseCase: Could not find vault ${params.sharedVault.uuid}`)
    }

    const response = await this.vaultUserServer.deleteSharedVaultUser({
      sharedVaultUuid: latestVaultListing.sharing.sharedVaultUuid,
      userUuid: this.users.sureUser.uuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to leave vault ${JSON.stringify(response)}`)
    }

    await this._deleteThirdPartyVault.execute(latestVaultListing)
  }
}
