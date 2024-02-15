import { Uuid } from '@standardnotes/domain-core'

import { AnyItemInterface } from '@standardnotes/models'

export interface SyncBackoffServiceInterface {
  isItemInBackoff(item: AnyItemInterface): boolean
  backoffItems(itemUuids: Uuid[]): void
  getSmallerSubsetOfItemUuidsInBackoff(): Uuid[]
}
