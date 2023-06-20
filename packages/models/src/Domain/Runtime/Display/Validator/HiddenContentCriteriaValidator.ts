import { DecryptedItemInterface } from './../../../Abstract/Item/Interfaces/DecryptedItem'
import { ContentType } from '@standardnotes/common'
import { CriteriaValidatorInterface } from './CriteriaValidatorInterface'

export class HiddenContentCriteriaValidator implements CriteriaValidatorInterface {
  constructor(private hiddenContentTypes: ContentType[], private element: DecryptedItemInterface) {}

  public passes(): boolean {
    return !this.hiddenContentTypes.includes(this.element.content_type)
  }
}
