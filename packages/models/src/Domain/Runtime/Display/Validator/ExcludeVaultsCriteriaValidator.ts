import { VaultListingInterface } from '../../../Syncable/VaultListing/VaultListingInterface'
import { CriteriaValidatorInterface } from './CriteriaValidatorInterface'
import { DecryptedItemInterface } from '../../../Abstract/Item'

export class ExcludeVaultsCriteriaValidator implements CriteriaValidatorInterface {
  constructor(private excludeVaults: VaultListingInterface[], private element: DecryptedItemInterface) {}

  public passes(): boolean {
    const doesElementBelongToExcludedVault = this.excludeVaults.some(
      (vault) => this.element.key_system_identifier === vault.systemIdentifier,
    )

    return !doesElementBelongToExcludedVault
  }
}
