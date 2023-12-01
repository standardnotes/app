import { SuperConverterServiceInterface } from '@standardnotes/files'
import { DecryptedTransferPayload, NoteContent } from '@standardnotes/models'
import { GenerateUuid } from '@standardnotes/services'
import { readFileAsText } from '../Utils'
import { parseFileName } from '@standardnotes/filepicker'
import { ContentType } from '@standardnotes/domain-core'
import { NativeFeatureIdentifier, NoteType } from '@standardnotes/features'
import { Converter } from '../Converter'

export class SuperConverter implements Converter {
  constructor(
    private converterService: SuperConverterServiceInterface,
    private _generateUuid: GenerateUuid,
  ) {}

  getImportType(): string {
    return 'super'
  }

  getSupportedFileTypes(): string[] {
    return ['application/json']
  }

  isContentValid(content: string): boolean {
    return this.converterService.isValidSuperString(content)
  }

  async convertSuperFileToNote(file: File): Promise<DecryptedTransferPayload<NoteContent>> {
    const content = await readFileAsText(file)

    if (!this.converterService.isValidSuperString(content)) {
      throw new Error('Content is not valid Super JSON')
    }

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
        noteType: NoteType.Super,
        editorIdentifier: NativeFeatureIdentifier.TYPES.SuperEditor,
      },
    }
  }
}
