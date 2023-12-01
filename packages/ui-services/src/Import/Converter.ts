import { NoteType } from '@standardnotes/features'
import { DecryptedTransferPayload, NoteContent } from '@standardnotes/models'

export interface Converter {
  getImportType(): string

  getSupportedFileTypes?: () => string[]
  getFileExtension?: () => string

  isContentValid: (content: string) => boolean

  convert(
    file: File,
    dependencies: {
      createNote: CreateNoteFn
      convertHTMLToSuper: (html: string) => string
      convertMarkdownToSuper: (markdown: string) => string
    },
  ): Promise<DecryptedTransferPayload<NoteContent>[]>
}

export type CreateNoteFn = (options: {
  createdAt: Date
  updatedAt: Date
  title: string
  text: string
  noteType?: NoteType
  trashed?: boolean
  editorIdentifier?: NoteContent['editorIdentifier']
}) => DecryptedTransferPayload<NoteContent>
