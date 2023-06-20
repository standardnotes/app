import { DisplayItem, DisplayControllerCustomFilter } from '../Types'
import { CriteriaValidatorInterface } from './CriteriaValidatorInterface'

export class CustomFilterCriteriaValidator<I extends DisplayItem> implements CriteriaValidatorInterface {
  constructor(private customFilter: DisplayControllerCustomFilter, private element: I) {}

  public passes(): boolean {
    return this.customFilter(this.element)
  }
}
