import { DecryptedItemInterface } from '@standardnotes/models'

export type ComponentViewerItem = { uuid: string } | { readonlyItem: DecryptedItemInterface }

export function isComponentViewerItemReadonlyItem(
  item: ComponentViewerItem,
): item is { readonlyItem: DecryptedItemInterface } {
  return 'readonlyItem' in item
}
