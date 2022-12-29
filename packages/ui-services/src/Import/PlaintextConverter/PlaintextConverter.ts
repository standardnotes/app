import { ContentType } from '@standardnotes/common'
import { parseFileName } from '@standardnotes/filepicker'
import { DecryptedTransferPayload, NoteContent } from '@standardnotes/models'
import { WebApplicationInterface } from '@standardnotes/services'
import { readFileAsText } from '../Utils'

export class PlaintextConverter {
  constructor(protected application: WebApplicationInterface) {}

  static isValidPlaintextFile(file: File): boolean {
    return file.type === 'text/plain' || file.type === 'text/markdown'
  }

  async convertPlaintextFileToNote(file: File): Promise<DecryptedTransferPayload<NoteContent>> {
    const content = await readFileAsText(file)

    const { name } = parseFileName(file.name)

    const createdAtDate = new Date(file.lastModified)
    const updatedAtDate = new Date(file.lastModified)

    return {
      created_at: createdAtDate,
      created_at_timestamp: createdAtDate.getTime(),
      updated_at: updatedAtDate,
      updated_at_timestamp: updatedAtDate.getTime(),
      uuid: this.application.generateUUID(),
      content_type: ContentType.Note,
      content: {
        title: name,
        text: content,
        references: [],
      },
    }
  }
}
