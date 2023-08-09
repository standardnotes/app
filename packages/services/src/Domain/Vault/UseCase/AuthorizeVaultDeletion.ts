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

export class AuthorizeVaultDeletion {
  constructor(
    private vaultLocks: VaultLockServiceInterface,
    private protection: ProtectionsClientInterface,
    private challenges: ChallengeServiceInterface,
    private _validateVaultPassword: ValidateVaultPassword,
  ) {}

  execute(vault: VaultListingInterface): Promise<boolean> {
    if (!this.vaultLocks.isVaultLockable(vault)) {
      return this.protection.authorizeAction(ChallengeReason.Custom, {
        fallBackToAccountPassword: true,
        requireAccountPassword: false,
        forcePrompt: true,
      })
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
          resolve(false)
        },
        onNonvalidatedSubmit: async (challengeResponse) => {
          const value = challengeResponse.getDefaultValue()
          if (!value) {
            this.challenges.completeChallenge(challenge)
            resolve(false)
            return
          }

          const password = value.value as string

          const validPassword = this._validateVaultPassword.execute(vault, password).getValue()
          if (!validPassword) {
            this.challenges.setValidationStatusForChallenge(challenge, value, false)
            resolve(false)
            return
          }

          this.challenges.completeChallenge(challenge)
          resolve(true)
        },
      })

      void this.challenges.promptForChallengeResponse(challenge)
    })
  }
}
