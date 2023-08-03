import { RotateVaultKey } from './RotateVaultKey'
import { SyncServiceInterface } from '@standardnotes/services'
import { KeySystemPasswordType, KeySystemRootKeyStorageMode } from '@standardnotes/models'
import { ChangeVaultKeyOptionsDTO } from './ChangeVaultKeyOptionsDTO'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { ChangeVaultStorageMode } from './ChangeVaultStorageMode'

export class ChangeVaultKeyOptions implements UseCaseInterface<void> {
  constructor(
    private sync: SyncServiceInterface,
    private _rotateVaultKey: RotateVaultKey,
    private _changeVaultStorageMode: ChangeVaultStorageMode,
  ) {}

  async execute(dto: ChangeVaultKeyOptionsDTO): Promise<Result<void>> {
    let newStorageMode = dto.newStorageMode
    let vault = dto.vault

    if (dto.newPasswordOptions) {
      if (
        dto.newPasswordOptions.passwordType === KeySystemPasswordType.Randomized &&
        dto.newStorageMode &&
        dto.newStorageMode !== KeySystemRootKeyStorageMode.Synced
      ) {
        return Result.fail('Cannot change storage mode to non-synced for randomized vault')
      }

      if (
        dto.newPasswordOptions.passwordType === KeySystemPasswordType.UserInputted &&
        !dto.newPasswordOptions.userInputtedPassword
      ) {
        return Result.fail('User inputted password required')
      }

      const result = await this._rotateVaultKey.execute({
        vault: dto.vault,
        userInputtedPassword:
          dto.newPasswordOptions.passwordType === KeySystemPasswordType.UserInputted
            ? dto.newPasswordOptions.userInputtedPassword
            : undefined,
      })
      if (result.isFailed()) {
        return result
      }

      vault = result.getValue()

      if (dto.newPasswordOptions.passwordType === KeySystemPasswordType.Randomized) {
        newStorageMode = KeySystemRootKeyStorageMode.Synced
      }
    }

    if (newStorageMode && newStorageMode !== vault.keyStorageMode) {
      const result = await this._changeVaultStorageMode.execute({
        vault: vault,
        newStorageMode: newStorageMode,
      })
      if (result.isFailed()) {
        return result
      }
    }

    await this.sync.sync()

    return Result.ok()
  }
}
