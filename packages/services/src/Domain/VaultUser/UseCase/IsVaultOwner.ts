import { UserServiceInterface } from './../../User/UserServiceInterface'
import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { SharedVaultListingInterface } from '@standardnotes/models'

export class IsVaultOwner implements SyncUseCaseInterface<boolean> {
  constructor(private users: UserServiceInterface) {}

  execute(dto: { sharedVault: SharedVaultListingInterface }): Result<boolean> {
    if (!dto.sharedVault.sharing.ownerUserUuid) {
      throw new Error(`Shared vault ${dto.sharedVault.sharing.sharedVaultUuid} does not have an owner user uuid`)
    }

    const user = this.users.sureUser

    return Result.ok(dto.sharedVault.sharing.ownerUserUuid === user.uuid)
  }
}
