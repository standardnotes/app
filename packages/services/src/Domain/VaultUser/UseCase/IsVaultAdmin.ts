import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { SharedVaultListingInterface } from '@standardnotes/models'

export class IsVaultAdmin implements SyncUseCaseInterface<boolean> {
  execute(dto: { sharedVault: SharedVaultListingInterface; userUuid: string }): Result<boolean> {
    if (!dto.sharedVault.sharing.ownerUserUuid) {
      throw new Error(`Shared vault ${dto.sharedVault.sharing.sharedVaultUuid} does not have an owner user uuid`)
    }

    return Result.ok(dto.sharedVault.sharing.ownerUserUuid === dto.userUuid)
  }
}
