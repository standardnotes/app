import { StorageKey } from './StorageKeys'

export interface KeyValueStoreInterface<T> {
  setValue(key: StorageKey, value: T): void
  getValue(key: StorageKey): T | undefined
  removeValue(key: StorageKey): void
}
