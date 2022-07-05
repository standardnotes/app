import { SearchableDecryptedItem } from './Types'
import { ItemContent } from '../../../Abstract/Content/ItemContent'
import { DecryptedItem } from '../../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../../Abstract/Payload/Interfaces/DecryptedPayload'
import { SNTag } from '../../../Syncable/Tag'

interface ItemWithTagsContent extends ItemContent {
  tags: SNTag[]
}

export class ItemWithTags extends DecryptedItem implements SearchableDecryptedItem {
  constructor(
    payload: DecryptedPayloadInterface<ItemWithTagsContent>,
    private item: SearchableDecryptedItem,
    public readonly tags?: SNTag[],
  ) {
    super(payload)
    this.tags = tags || payload.content.tags
  }

  static Create(payload: DecryptedPayloadInterface<ItemContent>, item: SearchableDecryptedItem, tags?: SNTag[]) {
    return new ItemWithTags(payload as DecryptedPayloadInterface<ItemWithTagsContent>, item, tags)
  }

  get tagsCount(): number {
    return this.tags?.length || 0
  }

  get title(): string | undefined {
    return this.item.title
  }

  get text(): string | undefined {
    return this.item.text
  }
}
