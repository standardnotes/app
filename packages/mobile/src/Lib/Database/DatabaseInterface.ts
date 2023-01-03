import { TransferPayload } from '@standardnotes/snjs'

export interface DatabaseInterface {
  getAllKeys(): Promise<string[]>
  multiDelete(keys: string[]): Promise<void>
  deleteItem(itemUuid: string): Promise<void>
  deleteAll(): Promise<void>
  setItems(items: TransferPayload[]): Promise<void>
  multiGet<T>(keys: string[]): Promise<T[]>
}
