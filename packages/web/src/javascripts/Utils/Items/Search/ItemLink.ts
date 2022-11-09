import { LinkableItem } from './LinkableItem'

export type ItemLink<ItemType extends LinkableItem = LinkableItem> = {
  id: string
  item: ItemType
  type: 'linked' | 'linked-by'
}
