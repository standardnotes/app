import { MMKV } from 'react-native-mmkv'

export class FlashKeyValueStore {
  private storage: MMKV

  constructor(identifier: string) {
    this.storage = new MMKV({ id: identifier })
  }

  set(key: string, value: unknown): void {
    this.storage.set(key, JSON.stringify(value))
  }

  delete(key: string): void {
    this.storage.delete(key)
  }

  deleteAll(): void {
    this.storage.clearAll()
  }

  getAllKeys(): string[] {
    return this.storage.getAllKeys()
  }

  get<T>(key: string): T | undefined {
    const item = this.storage.getString(key)
    if (item) {
      try {
        return JSON.parse(item)
      } catch (e) {
        return item as T
      }
    }
  }

  multiGet<T>(keys: string[]): (T | undefined)[] {
    return keys.map((key) => this.get<T>(key))
  }
}
