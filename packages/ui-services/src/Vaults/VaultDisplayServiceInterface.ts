import { VaultDisplayOptions, VaultListingInterface } from '@standardnotes/models'
import { AbstractUIServiceInterface } from '../Abstract/AbstractUIServiceInterface'

export interface VaultDisplayServiceInterface extends AbstractUIServiceInterface {
  getOptions(): VaultDisplayOptions
  isVaultExplicitelyExcluded: (vault: VaultListingInterface) => boolean
  isVaultExclusivelyShown: (vault: VaultListingInterface) => boolean
  hideVault: (vault: VaultListingInterface) => void
  unhideVault: (vault: VaultListingInterface) => void
  showOnlyVault: (vault: VaultListingInterface) => void
  unlockVault(vault: VaultListingInterface): Promise<boolean>
}
