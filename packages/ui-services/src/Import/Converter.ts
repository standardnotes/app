import { NoteType } from '@standardnotes/features'
import { DecryptedItemInterface, FileItem, ItemContent, NoteContent, SNNote, SNTag } from '@standardnotes/models'
import { ConversionResult } from './ConversionResult'
import { SuperConverterHTMLOptions } from '@standardnotes/snjs'

export type HTMLToSuperConverterFunction = (html: string, options?: SuperConverterHTMLOptions) => string

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
      canUploadFiles: boolean
      uploadFile: UploadFileFn
      canUseSuper: boolean
      convertHTMLToSuper: HTMLToSuperConverterFunction
      convertMarkdownToSuper: (markdown: string) => string
      readFileAsText: (file: File) => Promise<string>
      linkItems(
        item: DecryptedItemInterface<ItemContent>,
        itemToLink: DecryptedItemInterface<ItemContent>,
      ): Promise<void>
      cleanupItems(items: DecryptedItemInterface<ItemContent>[]): Promise<void>
    },
  ): Promise<ConversionResult>
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

export type UploadFileFn = (file: File) => Promise<FileItem | undefined>

export type LinkItemsFn = (
  item: DecryptedItemInterface<ItemContent>,
  itemToLink: DecryptedItemInterface<ItemContent>,
) => Promise<void>

export type CleanupItemsFn = (items: DecryptedItemInterface<ItemContent>[]) => Promise<void>
