import { parseFileName } from '@standardnotes/filepicker'
import { WebApplicationInterface } from '@standardnotes/services'
import { DecryptedTransferPayload } from '@standardnotes/snjs'
import { AegisToAuthenticatorConverter } from './AegisConverter/AegisToAuthenticatorConverter'
import { GoogleKeepConverter } from './GoogleKeepConverter/GoogleKeepConverter'
import { PlaintextConverter } from './PlaintextConverter/PlaintextConverter'
import { SimplenoteConverter } from './SimplenoteConverter/SimplenoteConverter'
import { readFileAsText } from './Utils'

export type NoteImportType = 'plaintext' | 'evernote' | 'google-keep' | 'simplenote' | 'aegis'

export class Importer {
  constructor(protected application: WebApplicationInterface) {}

  static detectService = async (file: File): Promise<NoteImportType | null> => {
    const content = await readFileAsText(file)

    const { ext } = parseFileName(file.name)

    if (ext === 'enex') {
      return 'evernote'
    }

    try {
      const json = JSON.parse(content)

      if (AegisToAuthenticatorConverter.isValidAegisJson(json)) {
        return 'aegis'
      }

      if (GoogleKeepConverter.isValidGoogleKeepJson(json)) {
        return 'google-keep'
      }

      if (SimplenoteConverter.isValidSimplenoteJson(json)) {
        return 'simplenote'
      }
    } catch {
      /* empty */
    }

    if (PlaintextConverter.isValidPlaintextFile(file)) {
      return 'plaintext'
    }

    return null
  }

  async importFromTransferPayloads(payloads: DecryptedTransferPayload[]): Promise<void> {
    for (const payload of payloads) {
      const itemPayload = this.application.items.createPayloadFromObject(payload)
      const item = this.application.items.createItemFromPayload(itemPayload)
      await this.application.mutator.insertItem(item)
    }
  }
}
