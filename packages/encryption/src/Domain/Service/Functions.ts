import { ItemsKeyInterface } from '@standardnotes/models'

export function findDefaultItemsKey(itemsKeys: ItemsKeyInterface[]): ItemsKeyInterface | undefined {
  if (itemsKeys.length === 1) {
    return itemsKeys[0]
  }

  const defaultKeys = itemsKeys.filter((key) => {
    return key.isDefault
  })

  if (defaultKeys.length > 1) {
    /**
     * Prioritize one that is synced, as neverSynced keys will likely be deleted after
     * DownloadFirst sync.
     */
    const syncedKeys = defaultKeys.filter((key) => !key.neverSynced)
    if (syncedKeys.length > 0) {
      return syncedKeys[0]
    }
  }

  return defaultKeys[0]
}
