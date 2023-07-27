import { CriteriaValidatorInterface } from './CriteriaValidatorInterface'
import { DecryptedItemInterface } from '../../../Abstract/Item'
import { KeySystemIdentifier } from '../../../Syncable/KeySystemRootKey/KeySystemIdentifier'

export class ExclusiveVaultCriteriaValidator implements CriteriaValidatorInterface {
  constructor(
    private exclusiveVault: KeySystemIdentifier,
    private element: DecryptedItemInterface,
  ) {}

  public passes(): boolean {
    return this.element.key_system_identifier === this.exclusiveVault
  }
}
