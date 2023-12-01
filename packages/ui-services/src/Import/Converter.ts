import { NoteType } from '@standardnotes/features'
import { DecryptedTransferPayload, ItemContent, NoteContent, TagContent } from '@standardnotes/models'

export interface Converter {
  getImportType(): string

  getSupportedFileTypes?: () => string[]
  getFileExtension?: () => string

  isContentValid: (content: string) => boolean

  convert(
    file: File,
    dependencies: {
      createNote: CreateNoteFn
      createTag: CreateTagFn
      canUseSuper: boolean
      convertHTMLToSuper: (html: string) => string
      convertMarkdownToSuper: (markdown: string) => string
    },
  ): Promise<DecryptedTransferPayload<ItemContent>[]>
}

export type CreateNoteFn = (options: {
  createdAt: Date
  updatedAt: Date
  title: string
  text: string
  noteType?: NoteType
  archived?: boolean
  pinned?: boolean
  trashed?: boolean
  editorIdentifier?: NoteContent['editorIdentifier']
}) => DecryptedTransferPayload<NoteContent>

export type CreateTagFn = (options: {
  createdAt: Date
  updatedAt: Date
  title: string
}) => DecryptedTransferPayload<TagContent>
