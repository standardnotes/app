import { DisplayItem } from '../Types'
import { VaultListingInterface } from '../../../Syncable/VaultListing/VaultListingInterface'
import { CriteriaValidatorInterface } from './CriteriaValidatorInterface'

export class ExclusiveVaultCriteriaValidator<I extends DisplayItem> implements CriteriaValidatorInterface {
  constructor(private exclusiveVault: VaultListingInterface, private element: I) {}

  public passes(): boolean {
    return this.element.key_system_identifier === this.exclusiveVault.systemIdentifier
  }
}
