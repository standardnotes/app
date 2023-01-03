import { DatabaseItemMetadata, isNotUndefined, TransferPayload } from '@standardnotes/snjs'
import { FlashKeyValueStore } from './FlashKeyValueStore'

const DidRunMigrationKey = 'didRunMetadataMigration'

export class DatabaseMetadata {
  constructor(private identifier: string, private flashStorage: FlashKeyValueStore) {}

  async needsMigration(): Promise<boolean> {
    const result = await this.flashStorage.get(DidRunMigrationKey)
    return result == undefined
  }

  setMetadataForPayloads(payloads: TransferPayload[]) {
    for (const payload of payloads) {
      const { uuid, content_type, updated_at } = payload
      const key = this.keyForUuid(uuid)
      const metadata: DatabaseItemMetadata = { uuid, content_type, updated_at }
      this.flashStorage.set(key, metadata)
    }
  }

  deleteMetadataItem(itemUuid: string) {
    const key = this.keyForUuid(itemUuid)
    this.flashStorage.delete(key)
  }

  getAllMetadataItems(): DatabaseItemMetadata[] {
    const keys = this.flashStorage.getAllKeys()
    const metadataKeys = keys.filter((key) => key.endsWith('-Metadata'))
    const metadataItems = this.flashStorage.multiGet<DatabaseItemMetadata>(metadataKeys).filter(isNotUndefined)
    return metadataItems
  }

  private setMigrated() {
    this.flashStorage.set(DidRunMigrationKey, 'true')
  }

  private keyForUuid(uuid: string) {
    return `${this.identifier}-Item-${uuid}-Metadata`
  }
}
