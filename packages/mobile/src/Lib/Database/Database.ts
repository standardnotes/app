import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  DatabaseKeysLoadChunk,
  DatabaseKeysLoadChunkResponse,
  DatabaseLoadOptions,
  GetSortedPayloadsByPriority,
  TransferPayload,
} from '@standardnotes/snjs'
import { Platform } from 'react-native'
import { DatabaseInterface } from './DatabaseInterface'
import { DatabaseMetadata } from './DatabaseMetadata'
import { FlashKeyValueStore } from './FlashKeyValueStore'
import { isLegacyIdentifier } from './LegacyIdentifier'
import { showLoadFailForItemIds } from './showLoadFailForItemIds'

export class Database implements DatabaseInterface {
  private metadataStore: DatabaseMetadata

  constructor(private identifier: string) {
    const flashStorage = new FlashKeyValueStore(identifier)
    this.metadataStore = new DatabaseMetadata(identifier, flashStorage)
  }

  private databaseKeyForPayloadId(id: string) {
    return `${this.getDatabaseKeyPrefix()}${id}`
  }

  private getDatabaseKeyPrefix() {
    if (this.identifier && !isLegacyIdentifier(this.identifier)) {
      return `${this.identifier}-Item-`
    } else {
      return 'Item-'
    }
  }

  async getAllEntries<T extends TransferPayload = TransferPayload>(): Promise<T[]> {
    const keys = await this.getAllKeys()
    return this.multiGet(keys)
  }

  async getAllKeys(): Promise<string[]> {
    const keys = await AsyncStorage.getAllKeys()
    const filtered = keys.filter((key) => {
      return key.startsWith(this.getDatabaseKeyPrefix())
    })
    return filtered
  }

  async multiDelete(keys: string[]): Promise<void> {
    return AsyncStorage.multiRemove(keys)
  }

  async deleteItem(itemUuid: string): Promise<void> {
    const key = this.databaseKeyForPayloadId(itemUuid)
    this.metadataStore.deleteMetadataItem(itemUuid)
    return this.multiDelete([key])
  }

  async deleteAll(): Promise<void> {
    const keys = await this.getAllKeys()
    return this.multiDelete(keys)
  }

  async setItems(items: TransferPayload[]): Promise<void> {
    if (items.length === 0) {
      return
    }

    await Promise.all(
      items.map((item) => {
        return Promise.all([
          AsyncStorage.setItem(this.databaseKeyForPayloadId(item.uuid), JSON.stringify(item)),
          this.metadataStore.setMetadataForPayloads([item]),
        ])
      }),
    )
  }

  async getLoadChunks(options: DatabaseLoadOptions): Promise<DatabaseKeysLoadChunkResponse> {
    let metadataItems = this.metadataStore.getAllMetadataItems()

    if (metadataItems.length === 0) {
      const allEntries = await this.getAllEntries()
      metadataItems = this.metadataStore.runMigration(allEntries)
    }

    const {
      itemsKeyPayloads,
      keySystemRootKeyPayloads,
      keySystemItemsKeyPayloads,
      contentTypePriorityPayloads,
      remainingPayloads,
    } = GetSortedPayloadsByPriority(metadataItems, options)

    const itemsKeysChunk: DatabaseKeysLoadChunk = {
      keys: itemsKeyPayloads.map((item) => this.databaseKeyForPayloadId(item.uuid)),
    }

    const keySystemRootKeysChunk: DatabaseKeysLoadChunk = {
      keys: keySystemRootKeyPayloads.map((item) => this.databaseKeyForPayloadId(item.uuid)),
    }

    const keySystemItemsKeysChunk: DatabaseKeysLoadChunk = {
      keys: keySystemItemsKeyPayloads.map((item) => this.databaseKeyForPayloadId(item.uuid)),
    }

    const contentTypePriorityChunk: DatabaseKeysLoadChunk = {
      keys: contentTypePriorityPayloads.map((item) => this.databaseKeyForPayloadId(item.uuid)),
    }

    const remainingKeys = remainingPayloads.map((item) => this.databaseKeyForPayloadId(item.uuid))

    const remainingKeysChunks: DatabaseKeysLoadChunk[] = []
    for (let i = 0; i < remainingKeys.length; i += options.batchSize) {
      remainingKeysChunks.push({
        keys: remainingKeys.slice(i, i + options.batchSize),
      })
    }

    const result: DatabaseKeysLoadChunkResponse = {
      keys: {
        itemsKeys: itemsKeysChunk,
        keySystemRootKeys: keySystemRootKeysChunk,
        keySystemItemsKeys: keySystemItemsKeysChunk,
        remainingChunks: [contentTypePriorityChunk, ...remainingKeysChunks],
      },
      remainingChunksItemCount: contentTypePriorityPayloads.length + remainingPayloads.length,
    }

    return result
  }

  async multiGet<T>(keys: string[]): Promise<T[]> {
    const results: T[] = []

    if (Platform.OS === 'android') {
      const failedItemIds: string[] = []
      for (const key of keys) {
        try {
          const item = await AsyncStorage.getItem(key)
          if (item) {
            try {
              results.push(JSON.parse(item) as T)
            } catch (e) {
              results.push(item as T)
            }
          }
        } catch (e) {
          console.error('Error getting item', key, e)
          failedItemIds.push(key)
        }
      }
      if (failedItemIds.length > 0) {
        showLoadFailForItemIds(failedItemIds)
      }
    } else {
      try {
        for (const item of await AsyncStorage.multiGet(keys)) {
          if (item[1]) {
            try {
              results.push(JSON.parse(item[1]))
            } catch (e) {
              results.push(item[1] as T)
            }
          }
        }
      } catch (e) {
        console.error('Error getting items', e)
      }
    }

    return results
  }
}
