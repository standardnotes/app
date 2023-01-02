import AsyncStorage from '@react-native-community/async-storage'
import { TransferPayload } from '@standardnotes/snjs'
import { DatabaseInterface } from './DatabaseInterface'
import { ItemMetadata } from './ItemMetadata'

const DidRunMigrationKey = 'didRunMetadataMigration'

export class DatabaseMetadata {
  constructor(private database: DatabaseInterface) {}

  async needsMigration(): Promise<boolean> {
    const result = await AsyncStorage.getItem(DidRunMigrationKey)
    return result == undefined
  }

  async setMigrated() {
    await AsyncStorage.setItem(DidRunMigrationKey, 'true')
  }

  private keyForUuid(uuid: string, appIdentifier: string) {
    return `${appIdentifier}-Item-${uuid}-Metadata`
  }

  async setMetadataForPayloads(payloads: TransferPayload[], appIdentifier: string) {
    for (const payload of payloads) {
      const { uuid, content_type, updated_at } = payload
      const key = this.keyForUuid(uuid, appIdentifier)
      const metadata: ItemMetadata = { content_type, updated_at }
      await AsyncStorage.setItem(key, JSON.stringify(metadata))
    }
  }

  async getAllMetadataItems(): Promise<ItemMetadata[]> {
    const keys = await AsyncStorage.getAllKeys()
    const metadataKeys = keys.filter((key) => key.endsWith('-Metadata'))
    const metadataItems = await this.database.multiGet<ItemMetadata>(metadataKeys)
    return metadataItems
  }
}
