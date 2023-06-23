import { VaultDisplayOptions, VaultListingInterface } from '@standardnotes/models'
import { AbstractUIServiceInterface } from '../Abstract/AbstractUIServiceInterface'

export interface VaultDisplayServiceInterface extends AbstractUIServiceInterface {
  exclusivelyShownVault?: VaultListingInterface

  getOptions(): VaultDisplayOptions

  isVaultDisabledOrLocked(vault: VaultListingInterface): boolean
  isVaultExplicitelyExcluded: (vault: VaultListingInterface) => boolean
  isVaultExclusivelyShown: (vault: VaultListingInterface) => boolean
  isInExclusiveDisplayMode(): boolean

  changeToMultipleVaultDisplayMode(): void

  hideVault: (vault: VaultListingInterface) => void
  unhideVault: (vault: VaultListingInterface) => void
  showOnlyVault: (vault: VaultListingInterface) => void
  unlockVault(vault: VaultListingInterface): Promise<boolean>
}
