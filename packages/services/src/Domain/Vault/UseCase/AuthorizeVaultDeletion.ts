import { VaultListingInterface } from '@standardnotes/models'
import { ProtectionsClientInterface } from '../../Protection/ProtectionClientInterface'
import { VaultLockServiceInterface } from '../../VaultLock/VaultLockServiceInterface'
import {
  ChallengeReason,
  Challenge,
  ChallengePrompt,
  ChallengeServiceInterface,
  ChallengeValidation,
} from '../../Challenge'
import { ChallengeStrings } from '../../Strings/Messages'
import { ValidateVaultPassword } from '../../VaultLock/UseCase/ValidateVaultPassword'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class AuthorizeVaultDeletion implements UseCaseInterface<boolean> {
  constructor(
    private vaultLocks: VaultLockServiceInterface,
    private protection: ProtectionsClientInterface,
    private challenges: ChallengeServiceInterface,
    private _validateVaultPassword: ValidateVaultPassword,
  ) {}

  async execute(vault: VaultListingInterface): Promise<Result<boolean>> {
    if (!this.vaultLocks.isVaultLockable(vault)) {
      const authorized = await this.protection.authorizeAction(ChallengeReason.Custom, {
        fallBackToAccountPassword: true,
        requireAccountPassword: false,
        forcePrompt: true,
      })
      return Result.ok(authorized)
    }

    const challenge = new Challenge(
      [new ChallengePrompt(ChallengeValidation.None, undefined, 'Password')],
      ChallengeReason.Custom,
      true,
      ChallengeStrings.DeleteVault(vault.name),
      ChallengeStrings.EnterVaultPassword,
    )

    return new Promise((resolve) => {
      this.challenges.addChallengeObserver(challenge, {
        onCancel() {
          resolve(Result.ok(false))
        },
        onNonvalidatedSubmit: async (challengeResponse) => {
          const value = challengeResponse.getDefaultValue()
          if (!value) {
            this.challenges.completeChallenge(challenge)
            resolve(Result.ok(false))
            return
          }

          const password = value.value as string

          if (this.vaultLocks.isVaultLocked(vault)) {
            const unlocked = await this.vaultLocks.unlockNonPersistentVault(vault, password)
            if (unlocked) {
              this.challenges.completeChallenge(challenge)
              resolve(Result.ok(true))
              return
            }
          }

          const validPassword = this._validateVaultPassword.execute(vault, password).getValue()
          if (!validPassword) {
            this.challenges.setValidationStatusForChallenge(challenge, value, false)
            resolve(Result.ok(false))
            return
          }

          this.challenges.completeChallenge(challenge)
          resolve(Result.ok(true))
        },
      })

      void this.challenges.promptForChallengeResponse(challenge)
    })
  }
}
