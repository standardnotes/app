import { GetVaults } from '../../Vault/UseCase/GetVaults'
import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { SharedVaultListingInterface } from '@standardnotes/models'

export class GetSharedVaults implements SyncUseCaseInterface<SharedVaultListingInterface[]> {
  constructor(private getVaults: GetVaults) {}

  execute(): Result<SharedVaultListingInterface[]> {
    const vaults = this.getVaults
      .execute()
      .getValue()
      .filter((vault) => vault.isSharedVaultListing())

    return Result.ok(vaults as SharedVaultListingInterface[])
  }
}
