import { ContentType } from '@standardnotes/common'
import { ContentReferenceType, DecryptedItemMutator } from '../../Abstract/Item'
import { ShareGroupToItemReference } from '../../Abstract/Reference/ShareGroupToItem'
import { ShareGroupToSharedItemsKeyReference } from '../../Abstract/Reference/ShareGroupToSharedItemsKey'
import { GroupKeyContent } from './GroupKeyContent'

export class GroupKeyMutator extends DecryptedItemMutator<GroupKeyContent> {
  public addItemReference(item: { uuid: string; content_type: ContentType }): void {
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

  public removeItemReference(item: { uuid: string }): void {
    this.mutableContent.references = this.mutableContent.references.filter((r) => r.uuid !== item.uuid)
  }

  public addSharedItemsKeyReference(item: { uuid: string; content_type: ContentType }): void {
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

  public removeSharedItemsKeyReference(item: { uuid: string }): void {
    this.mutableContent.references = this.mutableContent.references.filter((r) => r.uuid !== item.uuid)
  }
}
