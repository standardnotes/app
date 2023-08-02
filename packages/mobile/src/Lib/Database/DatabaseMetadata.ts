import { DatabaseItemMetadata, isNotUndefined, TransferPayload } from '@standardnotes/snjs'
import { FlashKeyValueStore } from './FlashKeyValueStore'

export class DatabaseMetadata {
  constructor(
    private identifier: string,
    private flashStorage: FlashKeyValueStore,
  ) {}

  runMigration(payloads: TransferPayload[]) {
    const metadataItems = this.setMetadataForPayloads(payloads)
    return metadataItems
  }

  setMetadataForPayloads(payloads: TransferPayload[]) {
    const metadataItems = []
    for (const payload of payloads) {
      const { uuid, content_type, updated_at } = payload
      const key = this.keyForUuid(uuid)
      const metadata: DatabaseItemMetadata = { uuid, content_type, updated_at }
      this.flashStorage.set(key, metadata)
      metadataItems.push(metadata)
    }
    return metadataItems
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

  private keyForUuid(uuid: string) {
    return `${this.identifier}-Item-${uuid}-Metadata`
  }
}
