import { ContentType } from '@standardnotes/domain-core'
import { parseFileName } from '@standardnotes/filepicker'
import { DecryptedTransferPayload, NoteContent } from '@standardnotes/models'
import { readFileAsText } from '../Utils'
import { GenerateUuid } from '@standardnotes/services'

export class PlaintextConverter {
  constructor(private _generateUuid: GenerateUuid) {}

  static isValidPlaintextFile(file: File): boolean {
    return file.type === 'text/plain' || file.type === 'text/markdown'
  }

  async convertPlaintextFileToNote(file: File): Promise<DecryptedTransferPayload<NoteContent>> {
    const content = await readFileAsText(file)

    const { name } = parseFileName(file.name)

    const createdAtDate = file.lastModified ? new Date(file.lastModified) : new Date()
    const updatedAtDate = file.lastModified ? new Date(file.lastModified) : new Date()

    return {
      created_at: createdAtDate,
      created_at_timestamp: createdAtDate.getTime(),
      updated_at: updatedAtDate,
      updated_at_timestamp: updatedAtDate.getTime(),
      uuid: this._generateUuid.execute().getValue(),
      content_type: ContentType.TYPES.Note,
      content: {
        title: name,
        text: content,
        references: [],
      },
    }
  }
}
