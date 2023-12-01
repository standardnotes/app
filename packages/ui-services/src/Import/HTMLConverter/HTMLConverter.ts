import { ContentType } from '@standardnotes/domain-core'
import { NativeFeatureIdentifier, NoteType } from '@standardnotes/features'
import { parseFileName } from '@standardnotes/filepicker'
import { SuperConverterServiceInterface } from '@standardnotes/files'
import { DecryptedTransferPayload, NoteContent } from '@standardnotes/models'
import { GenerateUuid } from '@standardnotes/services'
import { readFileAsText } from '../Utils'
import { Converter } from '../Converter'

export class HTMLConverter implements Converter {
  constructor(
    private superConverterService: SuperConverterServiceInterface,
    private _generateUuid: GenerateUuid,
  ) {}

  getImportType(): string {
    return 'html'
  }

  getSupportedFileTypes(): string[] {
    return ['text/html']
  }

  isContentValid(_content: string): boolean {
    return true
  }

  static isHTMLFile(file: File): boolean {
    return file.type === 'text/html'
  }

  async convertHTMLFileToNote(file: File, isEntitledToSuper: boolean): Promise<DecryptedTransferPayload<NoteContent>> {
    const content = await readFileAsText(file)

    const { name } = parseFileName(file.name)

    const createdAtDate = file.lastModified ? new Date(file.lastModified) : new Date()
    const updatedAtDate = file.lastModified ? new Date(file.lastModified) : new Date()

    const text = isEntitledToSuper
      ? this.superConverterService.convertOtherFormatToSuperString(content, 'html')
      : content

    return {
      created_at: createdAtDate,
      created_at_timestamp: createdAtDate.getTime(),
      updated_at: updatedAtDate,
      updated_at_timestamp: updatedAtDate.getTime(),
      uuid: this._generateUuid.execute().getValue(),
      content_type: ContentType.TYPES.Note,
      content: {
        title: name,
        text,
        references: [],
        ...(isEntitledToSuper
          ? {
              noteType: NoteType.Super,
              editorIdentifier: NativeFeatureIdentifier.TYPES.SuperEditor,
            }
          : {}),
      },
    }
  }
}
