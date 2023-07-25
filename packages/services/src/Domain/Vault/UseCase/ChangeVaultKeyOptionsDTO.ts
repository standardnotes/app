import { KeySystemRootKeyPasswordType, KeySystemRootKeyStorageMode, VaultListingInterface } from '@standardnotes/models'

export type ChangeVaultKeyOptionsDTO = {
  vault: VaultListingInterface
  newPasswordType:
    | { passwordType: KeySystemRootKeyPasswordType.Randomized }
    | { passwordType: KeySystemRootKeyPasswordType.UserInputted; userInputtedPassword: string }
    | undefined
  newKeyStorageMode: KeySystemRootKeyStorageMode | undefined
}
