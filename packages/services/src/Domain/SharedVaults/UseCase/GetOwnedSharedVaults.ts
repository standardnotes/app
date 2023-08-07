import { IsVaultOwner } from './../../VaultUser/UseCase/IsVaultOwner'
import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { SharedVaultListingInterface } from '@standardnotes/models'
import { GetSharedVaults } from './GetSharedVaults'

export class GetOwnedSharedVaults implements SyncUseCaseInterface<SharedVaultListingInterface[]> {
  constructor(
    private _getSharedVaults: GetSharedVaults,
    private _isVaultOwnwer: IsVaultOwner,
  ) {}

  execute(): Result<SharedVaultListingInterface[]> {
    const sharedVaults = this._getSharedVaults.execute().getValue()

    const ownedVaults = sharedVaults.filter((vault) => {
      return this._isVaultOwnwer.execute(vault).getValue()
    })

    return Result.ok(ownedVaults)
  }
}
