import { UserServiceInterface } from './../../User/UserServiceInterface'
import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { VaultListingInterface } from '@standardnotes/models'

export class IsVaultOwner implements SyncUseCaseInterface<boolean> {
  constructor(private users: UserServiceInterface) {}

  execute(vault: VaultListingInterface): Result<boolean> {
    if (!vault.sharing) {
      return Result.ok(true)
    }

    if (!vault.sharing.ownerUserUuid) {
      throw new Error(`Shared vault ${vault.sharing.sharedVaultUuid} does not have an owner user uuid`)
    }

    const user = this.users.sureUser

    return Result.ok(vault.sharing.ownerUserUuid === user.uuid)
  }
}
