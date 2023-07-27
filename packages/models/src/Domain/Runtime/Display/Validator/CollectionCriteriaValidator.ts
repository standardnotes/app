import { ItemInterface } from '../../../Abstract/Item'
import { ReadonlyItemCollection } from '../Types'
import { CriteriaValidatorInterface } from './CriteriaValidatorInterface'

export class CollectionCriteriaValidator implements CriteriaValidatorInterface {
  constructor(
    private collection: ReadonlyItemCollection,
    private element: ItemInterface,
  ) {}

  public passes(): boolean {
    return this.collection.has(this.element.uuid)
  }
}
