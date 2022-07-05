import { ItemContent } from '../../Abstract/Content/ItemContent'
import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { ItemContentsEqual } from './ItemContentsEqual'

export function ItemContentsDiffer(
  item1: DecryptedItemInterface,
  item2: DecryptedItemInterface,
  excludeContentKeys: (keyof ItemContent)[] = [],
) {
  return !ItemContentsEqual(
    item1.content as ItemContent,
    item2.content as ItemContent,
    [...item1.contentKeysToIgnoreWhenCheckingEquality(), ...excludeContentKeys],
    item1.appDataContentKeysToIgnoreWhenCheckingEquality(),
  )
}
