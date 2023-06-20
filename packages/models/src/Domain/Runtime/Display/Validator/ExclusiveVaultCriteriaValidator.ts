import { VaultListingInterface } from '../../../Syncable/VaultListing/VaultListingInterface'
import { CriteriaValidatorInterface } from './CriteriaValidatorInterface'
import { DecryptedItemInterface } from '../../../Abstract/Item'

export class ExclusiveVaultCriteriaValidator implements CriteriaValidatorInterface {
  constructor(private exclusiveVault: VaultListingInterface, private element: DecryptedItemInterface) {}

  public passes(): boolean {
    return this.element.key_system_identifier === this.exclusiveVault.systemIdentifier
  }
}
