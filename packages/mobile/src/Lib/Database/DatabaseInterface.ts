import { ApplicationIdentifier, TransferPayload } from '@standardnotes/snjs'

export interface DatabaseInterface {
  getAllKeys(identifier: string): Promise<string[]>
  multiDelete(keys: string[]): Promise<void>
  deleteItem(itemUuid: string, appIdentifier: string): Promise<void>
  deleteAll(identifier: ApplicationIdentifier): Promise<void>
  setItems(items: TransferPayload[], identifier: ApplicationIdentifier): Promise<void>
  multiGet<T>(keys: string[]): Promise<T[]>
}
