import { DisplayItem, ReadonlyItemCollection } from '../Types'
import { CriteriaValidatorInterface } from './CriteriaValidatorInterface'

export class CollectionCriteriaValidator<I extends DisplayItem> implements CriteriaValidatorInterface {
  constructor(private collection: ReadonlyItemCollection, private element: I) {}

  public passes(): boolean {
    return this.collection.has(this.element.uuid)
  }
}
