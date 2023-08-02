import { DecryptedItemInterface } from './../../../Abstract/Item/Interfaces/DecryptedItem'
import { CriteriaValidatorInterface } from './CriteriaValidatorInterface'

export class HiddenContentCriteriaValidator implements CriteriaValidatorInterface {
  constructor(
    private hiddenContentTypes: string[],
    private element: DecryptedItemInterface,
  ) {}

  public passes(): boolean {
    return !this.hiddenContentTypes.includes(this.element.content_type)
  }
}
