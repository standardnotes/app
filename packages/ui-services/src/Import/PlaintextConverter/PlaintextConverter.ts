import { ContentType } from '@standardnotes/domain-core'
import { parseFileName } from '@standardnotes/filepicker'
import { DecryptedTransferPayload, NoteContent } from '@standardnotes/models'
import { readFileAsText } from '../Utils'
import { UuidGenerator } from '@standardnotes/utils'

export class PlaintextConverter {
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
      uuid: UuidGenerator.GenerateUuid(),
      content_type: ContentType.TYPES.Note,
      content: {
        title: name,
        text: content,
        references: [],
      },
    }
  }
}
