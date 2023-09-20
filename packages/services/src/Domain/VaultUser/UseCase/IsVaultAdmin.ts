import { UserServiceInterface } from '../../User/UserServiceInterface'
import { Result, SharedVaultUserPermission, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { SharedVaultListingInterface } from '@standardnotes/models'
import { VaultUserCache } from '../VaultUserCache'

export class IsVaultAdmin implements SyncUseCaseInterface<boolean> {
  constructor(
    private users: UserServiceInterface,
    private cache: VaultUserCache,
  ) {}

  execute(vault: SharedVaultListingInterface): Result<boolean> {
    if (!vault.sharing) {
      return Result.ok(true)
    }

    if (!vault.sharing.ownerUserUuid) {
      throw new Error(`Shared vault ${vault.sharing.sharedVaultUuid} does not have an owner user uuid`)
    }

    const user = this.users.sureUser
    const vaultUsers = this.cache.get(vault.sharing.sharedVaultUuid)
    const userPermission = vaultUsers?.find((vaultUser) => vaultUser.user_uuid === user.uuid)?.permission

    return Result.ok(
      userPermission === SharedVaultUserPermission.PERMISSIONS.Admin || vault.sharing.ownerUserUuid === user.uuid,
    )
  }
}
