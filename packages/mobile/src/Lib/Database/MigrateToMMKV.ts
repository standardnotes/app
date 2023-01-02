import AsyncStorage from '@react-native-community/async-storage'
import { RawStorageKey } from '@standardnotes/snjs'
import { MMKV } from 'react-native-mmkv'
import { LEGACY_IDENTIFIER } from './LEGACY_IDENTIFIER'

const HasMigratedKey = 'hasMigratedFromAsyncStorage'

/** Migrate from AsyncStorage to MMKV */
export class AsyncStorageToMMKVMigrator {
  private databases: Record<string, MMKV> = {}

  /** Non-application specific DB that stores global RawStorageKey values */
  private getSharedGlobalDb() {
    return this.findOrCreateDatabase('rawStorage')
  }

  private findOrCreateDatabase(identifier: string): MMKV {
    const existing = this.databases[identifier]
    if (existing) {
      return existing
    }

    const newDb = new MMKV({ id: identifier })
    this.databases[identifier] = newDb
    return newDb
  }

  needsMigration(): boolean {
    return this.getSharedGlobalDb().getBoolean(HasMigratedKey) == undefined
  }

  setMigrated() {
    this.getSharedGlobalDb().set(HasMigratedKey, true)
  }

  private breakdownAsyncStorageItemKey(key: string) {
    if (!key.includes('Item')) {
      return undefined
    }

    /**
     * key can be of the format of either `${identifier}-Item-${itemUuid}` or `Item-${itemUuid}`
     * We want to return just the identifier.
     */
    const split = key.split('-')
    if (split.length === 3) {
      const newKey = `Item-${split[2]}`
      return { identifier: split[0], newKey, contentTypeKey: `${newKey}-ContentType` }
    } else if (split.length === 2) {
      return { identifier: LEGACY_IDENTIFIER, newKey: key, contentTypeKey: `${key}-ContentType` }
    }

    return undefined
  }

  async performMigration() {
    const keys = await AsyncStorage.getAllKeys()

    for (const key of keys) {
      try {
        const isRawStorageKey = Object.values(RawStorageKey).includes(key as RawStorageKey)
        const itemKeyParts = this.breakdownAsyncStorageItemKey(key)
        const database =
          isRawStorageKey || !itemKeyParts
            ? this.getSharedGlobalDb()
            : this.findOrCreateDatabase(itemKeyParts.identifier)

        const value = await AsyncStorage.getItem(key)

        if (value != null) {
          if (itemKeyParts) {
            database.set(itemKeyParts.newKey, value)

            try {
              const item = JSON.parse(value)
              database.set(itemKeyParts.contentTypeKey, item.content_type)
            } catch (error) {
              console.error(`Failed to parse item "${key}" from AsyncStorage`, error)
              continue
            }
          } else {
            database.set(key, value)
          }

          await AsyncStorage.removeItem(key)
        }
      } catch (error) {
        console.error(`Failed to migrate key "${key}" from AsyncStorage to MMKV`, error)
        throw error
      }
    }

    this.setMigrated()
  }
}
