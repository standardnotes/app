import { ContentType } from '@standardnotes/common'
import { ContentReferenceType, DecryptedItemInterface, DecryptedItemMutator } from '../../Abstract/Item'
import { ShareGroupToItemReference } from '../../Abstract/Reference/ShareGroupToItem'
import { ShareGroupToSharedItemsKeyReference } from '../../Abstract/Reference/ShareGroupToSharedItemsKey'
import { SharedItemsKeyInterface } from '../SharedItemsKey/SharedItemsKeyInterface'
import { ShareGroupKeyContent } from './ShareGroupKeyContent'

export class ShareGroupKeyMutator extends DecryptedItemMutator<ShareGroupKeyContent> {
  public addItemReference(item: DecryptedItemInterface): void {
    if (this.immutableItem.isReferencingItem(item)) {
      return
    }

    const reference: ShareGroupToItemReference = {
      uuid: item.uuid,
      content_type: item.content_type,
      reference_type: ContentReferenceType.ShareGroupToItem,
    }

    this.mutableContent.references.push(reference)
  }

  public removeItemReference(item: DecryptedItemInterface): void {
    this.mutableContent.references = this.mutableContent.references.filter((r) => r.uuid !== item.uuid)
  }

  public addSharedItemsKeyReference(item: SharedItemsKeyInterface): void {
    if (this.immutableItem.isReferencingItem(item)) {
      return
    }

    const reference: ShareGroupToSharedItemsKeyReference = {
      uuid: item.uuid,
      content_type: ContentType.SharedItemsKey,
      reference_type: ContentReferenceType.ShareGroupToSharedItemsKey,
    }

    this.mutableContent.references.push(reference)
  }

  public removeSharedItemsKeyReference(item: SharedItemsKeyInterface): void {
    this.mutableContent.references = this.mutableContent.references.filter((r) => r.uuid !== item.uuid)
  }
}
