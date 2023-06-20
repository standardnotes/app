import { DisplayItem } from '../Types'
import { VaultListingInterface } from '../../../Syncable/VaultListing/VaultListingInterface'
import { CriteriaValidatorInterface } from './CriteriaValidatorInterface'

export class ExcludeVaultsCriteriaValidator<I extends DisplayItem> implements CriteriaValidatorInterface {
  constructor(private excludeVaults: VaultListingInterface[], private element: I) {}

  public passes(): boolean {
    const doesElementBelongToExcludedVault = this.excludeVaults.some(
      (vault) => this.element.key_system_identifier === vault.systemIdentifier,
    )

    return !doesElementBelongToExcludedVault
  }
}
