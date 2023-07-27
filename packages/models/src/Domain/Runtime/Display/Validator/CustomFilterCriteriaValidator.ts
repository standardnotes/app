import { DecryptedItemInterface } from '../../../Abstract/Item'
import { DisplayControllerCustomFilter } from '../Types'
import { CriteriaValidatorInterface } from './CriteriaValidatorInterface'

export class CustomFilterCriteriaValidator implements CriteriaValidatorInterface {
  constructor(
    private customFilter: DisplayControllerCustomFilter,
    private element: DecryptedItemInterface,
  ) {}

  public passes(): boolean {
    return this.customFilter(this.element)
  }
}
