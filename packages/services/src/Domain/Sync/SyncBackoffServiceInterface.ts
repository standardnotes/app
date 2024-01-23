import { AnyItemInterface } from '@standardnotes/models'

export interface SyncBackoffServiceInterface {
  isItemInBackoff(item: AnyItemInterface): boolean
  backoffItem(item: AnyItemInterface): void
}
