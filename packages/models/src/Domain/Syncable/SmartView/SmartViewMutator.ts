import { DecryptedItemInterface, MutationType } from '../../Abstract/Item'
import { TagMutator } from '../Tag'
import { SmartViewContent } from './SmartViewContent'

export class SmartViewMutator extends TagMutator<SmartViewContent> {
  constructor(item: DecryptedItemInterface<SmartViewContent>, type: MutationType) {
    super(item, type)
  }

  set predicate(predicate: SmartViewContent['predicate']) {
    this.mutableContent.predicate = predicate
  }
}
