import { KeySystemPasswordType, KeySystemRootKeyStorageMode, VaultListingInterface } from '@standardnotes/models'

export type ChangeVaultKeyOptionsDTO = {
  vault: VaultListingInterface
  newPasswordOptions:
    | { passwordType: KeySystemPasswordType.Randomized }
    | { passwordType: KeySystemPasswordType.UserInputted; userInputtedPassword: string }
    | undefined
  newStorageMode: KeySystemRootKeyStorageMode | undefined
}
