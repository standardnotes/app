import { ItemLink } from './ItemLink'
import { LinkableItem } from './LinkableItem'

export function createLinkFromItem<I extends LinkableItem = LinkableItem>(
  itemA: I,
  type: 'linked' | 'linked-by',
): ItemLink<I> {
  return {
    id: `${itemA.uuid}-${type}`,
    item: itemA,
    type,
  }
}
