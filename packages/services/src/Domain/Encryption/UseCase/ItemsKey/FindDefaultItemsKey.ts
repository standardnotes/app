import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { ItemsKeyInterface } from '@standardnotes/models'

export class FindDefaultItemsKey implements SyncUseCaseInterface<ItemsKeyInterface | undefined> {
  execute(itemsKeys: ItemsKeyInterface[]): Result<ItemsKeyInterface | undefined> {
    if (itemsKeys.length === 1) {
      return Result.ok(itemsKeys[0])
    }

    const defaultKeys = itemsKeys.filter((key) => {
      return key.isDefault
    })

    if (defaultKeys.length === 0) {
      return Result.ok(undefined)
    }

    if (defaultKeys.length === 1) {
      return Result.ok(defaultKeys[0])
    }

    /**
     * Prioritize one that is synced, as neverSynced keys will likely be deleted after
     * DownloadFirst sync.
     */
    const syncedKeys = defaultKeys.filter((key) => !key.neverSynced)
    if (syncedKeys.length > 0) {
      return Result.ok(syncedKeys[0])
    }

    return Result.ok(undefined)
  }
}
