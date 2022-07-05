import { ItemContent } from '../../Abstract/Content/ItemContent'
import { DecryptedItemInterface, DeletedItemInterface, EncryptedItemInterface } from '../../Abstract/Item'
import { AnyItemInterface } from '../../Abstract/Item/Interfaces/UnionTypes'

export interface ItemDelta<C extends ItemContent = ItemContent> {
  changed: AnyItemInterface[]
  inserted: AnyItemInterface[]
  /** Items that were deleted and finished sync */
  discarded: DeletedItemInterface[]
  /** Items which have encrypted overwrite protection enabled */
  ignored: EncryptedItemInterface[]
  /** Items which were previously error decrypting which have now been successfully decrypted */
  unerrored: DecryptedItemInterface<C>[]
}

export function CreateItemDelta(partial: Partial<ItemDelta>): ItemDelta {
  return {
    changed: partial.changed || [],
    inserted: partial.inserted || [],
    discarded: partial.discarded || [],
    ignored: partial.ignored || [],
    unerrored: partial.unerrored || [],
  }
}
