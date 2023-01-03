import AsyncStorage from '@react-native-community/async-storage'
import { DatabaseItemMetadata, TransferPayload } from '@standardnotes/snjs'
import { DatabaseInterface } from './DatabaseInterface'

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
      const metadata: DatabaseItemMetadata = { uuid, content_type, updated_at }
      await AsyncStorage.setItem(key, JSON.stringify(metadata))
    }
  }

  async deleteMetadataItem(itemUuid: string, appIdentifier: string) {
    const key = this.keyForUuid(itemUuid, appIdentifier)
    await AsyncStorage.removeItem(key)
  }

  async getAllMetadataItems(): Promise<DatabaseItemMetadata[]> {
    const keys = await AsyncStorage.getAllKeys()
    const metadataKeys = keys.filter((key) => key.endsWith('-Metadata'))
    const metadataItems = await this.database.multiGet<DatabaseItemMetadata>(metadataKeys)
    return metadataItems
  }
}
