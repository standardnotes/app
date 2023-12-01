import { NoteType } from '@standardnotes/features'
import { DecryptedTransferPayload, NoteContent } from '@standardnotes/models'

export interface Converter {
  getImportType(): string

  getSupportedFileTypes?: () => string[]
  getFileExtension?: () => string

  isContentValid: (content: string) => boolean

  convert(
    file: File,
    {
      createNote,
    }: {
      createNote: CreateNoteFn
    },
  ): Promise<DecryptedTransferPayload<NoteContent>[]>
}

export type CreateNoteFn = (options: {
  createdAt: Date
  updatedAt: Date
  title: string
  text: string
  noteType?: NoteType
}) => DecryptedTransferPayload<NoteContent>
