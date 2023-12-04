import { parseFileName } from '@standardnotes/filepicker'
import { Converter } from '../Converter'
import { NoteType } from '@standardnotes/features'

export class PlaintextConverter implements Converter {
  constructor() {}

  getImportType(): string {
    return 'plaintext'
  }

  getSupportedFileTypes(): string[] {
    return ['text/plain', 'text/markdown']
  }

  isContentValid(_content: string): boolean {
    return true
  }

  static isValidPlaintextFile(file: File): boolean {
    return file.type === 'text/plain' || file.type === 'text/markdown'
  }

  convert: Converter['convert'] = async (file, { createNote, convertMarkdownToSuper, readFileAsText }) => {
    const content = await readFileAsText(file)

    const { name } = parseFileName(file.name)

    const createdAtDate = file.lastModified ? new Date(file.lastModified) : new Date()
    const updatedAtDate = file.lastModified ? new Date(file.lastModified) : new Date()

    return [
      createNote({
        createdAt: createdAtDate,
        updatedAt: updatedAtDate,
        title: name,
        text: convertMarkdownToSuper(content),
        noteType: NoteType.Super,
      }),
    ]
  }
}
