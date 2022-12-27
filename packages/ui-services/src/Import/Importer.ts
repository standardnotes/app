import { WebApplicationInterface } from '@standardnotes/services'
import { DecryptedTransferPayload } from '@standardnotes/snjs'

export class Importer {
  constructor(protected application: WebApplicationInterface) {}

  async importFromTransferPayloads(payloads: DecryptedTransferPayload[]): Promise<void> {
    for (const payload of payloads) {
      const itemPayload = this.application.items.createPayloadFromObject(payload)
      const item = this.application.items.createItemFromPayload(itemPayload)
      await this.application.mutator.insertItem(item)
    }
  }
}
