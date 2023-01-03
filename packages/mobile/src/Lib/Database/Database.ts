import AsyncStorage from '@react-native-community/async-storage'
import {
  ApplicationIdentifier,
  DatabaseLoadChunk,
  DatabaseLoadChunkResponse,
  DatabaseLoadOptions,
  GetSortedPayloadsByPriority,
  TransferPayload,
} from '@standardnotes/snjs'
import { Platform } from 'react-native'
import { DatabaseInterface } from './DatabaseInterface'
import { DatabaseMetadata } from './DatabaseMetadata'
import { isLegacyIdentifier } from './LegacyIdentifier'
import { showLoadFailForItemIds } from './showLoadFailForItemIds'

export class Database implements DatabaseInterface {
  private metadataStore = new DatabaseMetadata(this)

  public async needsMigration(): Promise<boolean> {
    return this.metadataStore.needsMigration()
  }

  private databaseKeyForPayloadId(id: string, identifier: ApplicationIdentifier) {
    return `${this.getDatabaseKeyPrefix(identifier)}${id}`
  }

  private getDatabaseKeyPrefix(identifier: ApplicationIdentifier) {
    if (identifier && !isLegacyIdentifier(identifier)) {
      return `${identifier}-Item-`
    } else {
      return 'Item-'
    }
  }

  async getAllKeys(identifier: string): Promise<string[]> {
    const keys = await AsyncStorage.getAllKeys()
    const filtered = keys.filter((key) => {
      return key.startsWith(this.getDatabaseKeyPrefix(identifier))
    })
    return filtered
  }

  async multiDelete(keys: string[]): Promise<void> {
    return AsyncStorage.multiRemove(keys)
  }

  async deleteItem(itemUuid: string, appIdentifier: string): Promise<void> {
    const key = this.databaseKeyForPayloadId(itemUuid, appIdentifier)
    await this.metadataStore.deleteMetadataItem(itemUuid, appIdentifier)
    return this.multiDelete([key])
  }

  async deleteAll(identifier: ApplicationIdentifier): Promise<void> {
    const keys = await this.getAllKeys(identifier)
    return this.multiDelete(keys)
  }

  async setItems(items: TransferPayload[], identifier: ApplicationIdentifier): Promise<void> {
    if (items.length === 0) {
      return
    }

    await Promise.all(
      items.map((item) => {
        return Promise.all([
          AsyncStorage.setItem(this.databaseKeyForPayloadId(item.uuid, identifier), JSON.stringify(item)),
          this.metadataStore.setMetadataForPayloads([item], identifier),
        ])
      }),
    )
  }

  async getLoadChunks(options: DatabaseLoadOptions, identifier: string): Promise<DatabaseLoadChunkResponse> {
    const metadataItems = await this.metadataStore.getAllMetadataItems()
    const sorted = GetSortedPayloadsByPriority(metadataItems, options)

    const itemsKeysChunk: DatabaseLoadChunk = {
      keys: sorted.itemsKeyPayloads.map((item) => this.databaseKeyForPayloadId(item.uuid, identifier)),
    }

    const contentTypePriorityChunk: DatabaseLoadChunk = {
      keys: sorted.contentTypePriorityPayloads.map((item) => this.databaseKeyForPayloadId(item.uuid, identifier)),
    }

    const remainingKeys = sorted.remainingPayloads.map((item) => this.databaseKeyForPayloadId(item.uuid, identifier))

    const remainingKeysChunks: DatabaseLoadChunk[] = []
    for (let i = 0; i < remainingKeys.length; i += options.batchSize) {
      remainingKeysChunks.push({
        keys: remainingKeys.slice(i, i + options.batchSize),
      })
    }

    const result: DatabaseLoadChunkResponse = {
      itemsKeys: itemsKeysChunk,
      remainingChunks: [contentTypePriorityChunk, ...remainingKeysChunks],
      remainingChunksItemCount: sorted.contentTypePriorityPayloads.length + sorted.remainingPayloads.length,
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
