import { IsVaultOwner } from './../../VaultUser/UseCase/IsVaultOwner'
import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { SharedVaultListingInterface } from '@standardnotes/models'
import { GetSharedVaults } from './GetSharedVaults'

export class GetOwnedSharedVaults implements SyncUseCaseInterface<SharedVaultListingInterface[]> {
  constructor(private getSharedVaults: GetSharedVaults, private isVaultOwnwer: IsVaultOwner) {}

  execute(dto: { userUuid: string }): Result<SharedVaultListingInterface[]> {
    const sharedVaults = this.getSharedVaults.execute().getValue()

    const ownedVaults = sharedVaults.filter((vault) => {
      return this.isVaultOwnwer
        .execute({
          sharedVault: vault,
          userUuid: dto.userUuid,
        })
        .getValue()
    })

    return Result.ok(ownedVaults)
  }
}
