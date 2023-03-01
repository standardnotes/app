import AsyncStorage from '@react-native-async-storage/async-storage'

export class LegacyKeyValueStore {
  set(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, JSON.stringify(value))
  }

  delete(key: string): Promise<void> {
    return AsyncStorage.removeItem(key)
  }

  deleteAll(): Promise<void> {
    return AsyncStorage.clear()
  }

  async getValue<T>(key: string): Promise<T | undefined> {
    const item = await AsyncStorage.getItem(key)
    if (item) {
      try {
        return JSON.parse(item)
      } catch (e) {
        return item as T
      }
    }
  }
}
