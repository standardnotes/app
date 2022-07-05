import { KeyValueStoreInterface } from './KeyValueStoreInterface'
import { StorageKey } from './StorageKeys'

export class InMemoryStore implements KeyValueStoreInterface<string> {
  private values: Map<StorageKey, string>

  constructor() {
    this.values = new Map<StorageKey, string>()
  }

  setValue(key: StorageKey, value: string): void {
    this.values.set(key, value)
  }

  getValue(key: StorageKey): string | undefined {
    return this.values.get(key)
  }

  removeValue(key: StorageKey): void {
    this.values.delete(key)
  }
}
