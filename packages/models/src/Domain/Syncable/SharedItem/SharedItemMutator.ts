import { ContentReferenceType, DecryptedItemInterface, DecryptedItemMutator } from '../../Abstract/Item'
import { SharedItemToItemReference } from '../../Abstract/Reference/SharedItemToItem'
import { SharedItemContent } from './SharedItemContent'

export class SharedItemMutator extends DecryptedItemMutator<SharedItemContent> {
  set expired(expired: boolean) {
    this.mutableContent.expired = expired
  }

  public addItemReference(item: DecryptedItemInterface): void {
    if (this.immutableItem.isReferencingItem(item)) {
      return
    }

    const reference: SharedItemToItemReference = {
      uuid: item.uuid,
      content_type: item.content_type,
      reference_type: ContentReferenceType.SharedItemToItem,
    }

    this.mutableContent.references.push(reference)
  }

  public removeItemReference(item: DecryptedItemInterface): void {
    this.mutableContent.references = this.mutableContent.references.filter((r) => r.uuid !== item.uuid)
  }
}
