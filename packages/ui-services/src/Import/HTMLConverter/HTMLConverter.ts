import { parseFileName } from '@standardnotes/filepicker'
import { Converter } from '../Converter'

export class HTMLConverter implements Converter {
  constructor() {}

  getImportType(): string {
    return 'html'
  }

  getSupportedFileTypes(): string[] {
    return ['text/html']
  }

  isContentValid(_content: string): boolean {
    return true
  }

  convert: Converter['convert'] = async (file, { createNote, convertHTMLToSuper, readFileAsText }) => {
    const content = await readFileAsText(file)

    const { name } = parseFileName(file.name)

    const createdAtDate = file.lastModified ? new Date(file.lastModified) : new Date()
    const updatedAtDate = file.lastModified ? new Date(file.lastModified) : new Date()

    const text = convertHTMLToSuper(content)

    return [
      createNote({
        createdAt: createdAtDate,
        updatedAt: updatedAtDate,
        title: name,
        text,
        useSuperIfPossible: true,
      }),
    ]
  }
}
