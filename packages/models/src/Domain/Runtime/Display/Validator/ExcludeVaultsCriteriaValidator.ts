import { CriteriaValidatorInterface } from './CriteriaValidatorInterface'
import { DecryptedItemInterface } from '../../../Abstract/Item'
import { KeySystemIdentifier } from '../../../Syncable/KeySystemRootKey/KeySystemIdentifier'

export class ExcludeVaultsCriteriaValidator implements CriteriaValidatorInterface {
  constructor(
    private excludeVaults: KeySystemIdentifier[],
    private element: DecryptedItemInterface,
  ) {}

  public passes(): boolean {
    const doesElementBelongToExcludedVault = this.excludeVaults.some(
      (vault) => this.element.key_system_identifier === vault,
    )

    return !doesElementBelongToExcludedVault
  }
}
