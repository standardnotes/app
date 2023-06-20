import { ContentType } from '@standardnotes/common'
import { DisplayItem } from '../Types'
import { CriteriaValidatorInterface } from './CriteriaValidatorInterface'

export class HiddenContentCriteriaValidator<I extends DisplayItem> implements CriteriaValidatorInterface {
  constructor(private hiddenContentTypes: ContentType[], private element: I) {}

  public passes(): boolean {
    return !this.hiddenContentTypes.includes(this.element.content_type)
  }
}
