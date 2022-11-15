import { DecryptedItemInterface, DecryptedItemMutator, MutationType } from '../../Abstract/Item'
import { SmartViewContent } from './SmartViewContent'

export class SmartViewMutator extends DecryptedItemMutator<SmartViewContent> {
  constructor(item: DecryptedItemInterface<SmartViewContent>, type: MutationType) {
    super(item, type)
  }

  set title(title: string) {
    this.mutableContent.title = title
  }

  set iconString(iconString: string) {
    this.mutableContent.iconString = iconString
  }

  set predicate(predicate: SmartViewContent['predicate']) {
    this.mutableContent.predicate = predicate
  }
}
