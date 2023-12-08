import { NoteType } from '@standardnotes/features'
import { DecryptedItemInterface, ItemContent, NoteContent, SNNote, SNTag } from '@standardnotes/models'

export interface Converter {
  getImportType(): string

  getSupportedFileTypes?: () => string[]
  getFileExtension?: () => string

  isContentValid: (content: string) => boolean

  convert(
    file: File,
    dependencies: {
      insertNote: InsertNoteFn
      insertTag: InsertTagFn
      canUseSuper: boolean
      convertHTMLToSuper: (html: string) => string
      convertMarkdownToSuper: (markdown: string) => string
      readFileAsText: (file: File) => Promise<string>
      linkItems(
        item: DecryptedItemInterface<ItemContent>,
        itemToLink: DecryptedItemInterface<ItemContent>,
      ): Promise<void>
    },
  ): Promise<void>
}

export type InsertNoteFn = (options: {
  createdAt: Date
  updatedAt: Date
  title: string
  text: string
  noteType?: NoteType
  archived?: boolean
  pinned?: boolean
  trashed?: boolean
  editorIdentifier?: NoteContent['editorIdentifier']
  useSuperIfPossible: boolean
}) => Promise<SNNote>

export type InsertTagFn = (options: {
  createdAt: Date
  updatedAt: Date
  title: string
  references: SNTag['references']
}) => Promise<SNTag>

export type LinkItemsFn = (
  item: DecryptedItemInterface<ItemContent>,
  itemToLink: DecryptedItemInterface<ItemContent>,
) => Promise<void>
