import { SuperConverterServiceInterface } from '@standardnotes/files'
import { parseFileName } from '@standardnotes/filepicker'
import { NoteType } from '@standardnotes/features'
import { Converter } from '../Converter'

export class SuperConverter implements Converter {
  constructor(private converterService: SuperConverterServiceInterface) {}

  getImportType(): string {
    return 'super'
  }

  getSupportedFileTypes(): string[] {
    return ['application/json']
  }

  isContentValid(content: string): boolean {
    return this.converterService.isValidSuperString(content)
  }

  convert: Converter['convert'] = async (file, { createNote, readFileAsText }) => {
    const content = await readFileAsText(file)

    if (!this.converterService.isValidSuperString(content)) {
      throw new Error('Content is not valid Super JSON')
    }

    const { name } = parseFileName(file.name)

    const createdAtDate = file.lastModified ? new Date(file.lastModified) : new Date()
    const updatedAtDate = file.lastModified ? new Date(file.lastModified) : new Date()

    return [
      createNote({
        createdAt: createdAtDate,
        updatedAt: updatedAtDate,
        title: name,
        text: content,
        noteType: NoteType.Super,
      }),
    ]
  }
}
