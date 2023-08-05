import { ContentType, Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { DecryptedItemInterface, SNTag } from '@standardnotes/models'
import { ItemManagerInterface } from '@standardnotes/services'

export class GetItemTags implements SyncUseCaseInterface<SNTag[]> {
  constructor(private items: ItemManagerInterface) {}

  execute(item: DecryptedItemInterface): Result<SNTag[]> {
    return Result.ok(
      this.items.itemsReferencingItem<SNTag>(item).filter((ref) => {
        return ref.content_type === ContentType.TYPES.Tag
      }),
    )
  }
}
