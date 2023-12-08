import { parseFileName } from '@standardnotes/filepicker'
import {
  FeatureStatus,
  FeaturesClientInterface,
  GenerateUuid,
  ItemManagerInterface,
  MutatorClientInterface,
} from '@standardnotes/services'
import { NativeFeatureIdentifier, NoteType } from '@standardnotes/features'
import { AegisToAuthenticatorConverter } from './AegisConverter/AegisToAuthenticatorConverter'
import { EvernoteConverter } from './EvernoteConverter/EvernoteConverter'
import { GoogleKeepConverter } from './GoogleKeepConverter/GoogleKeepConverter'
import { PlaintextConverter } from './PlaintextConverter/PlaintextConverter'
import { SimplenoteConverter } from './SimplenoteConverter/SimplenoteConverter'
import { readFileAsText } from './Utils'
import {
  DecryptedItemInterface,
  DecryptedTransferPayload,
  FileItem,
  ItemContent,
  NoteContent,
  NoteMutator,
  SNNote,
  SNTag,
  TagContent,
  isNote,
} from '@standardnotes/models'
import { HTMLConverter } from './HTMLConverter/HTMLConverter'
import { SuperConverter } from './SuperConverter/SuperConverter'
import { Converter, InsertNoteFn, InsertTagFn, LinkItemsFn } from './Converter'
import { SuperConverterServiceInterface } from '@standardnotes/files'
import { ContentType } from '@standardnotes/domain-core'

export class Importer {
  converters: Set<Converter> = new Set()

  constructor(
    private features: FeaturesClientInterface,
    private mutator: MutatorClientInterface,
    private items: ItemManagerInterface,
    private superConverterService: SuperConverterServiceInterface,
    private filesController: {
      uploadNewFile(
        fileOrHandle: File | FileSystemFileHandle,
        options?: {
          showToast?: boolean
          note?: SNNote
        },
      ): Promise<FileItem | undefined>
    },
    private linkingController: {
      linkItems(
        item: DecryptedItemInterface<ItemContent>,
        itemToLink: DecryptedItemInterface<ItemContent>,
        sync: boolean,
      ): Promise<void>
    },
    private _generateUuid: GenerateUuid,
  ) {
    this.registerNativeConverters()
  }

  registerNativeConverters() {
    this.converters.add(new AegisToAuthenticatorConverter())
    this.converters.add(new GoogleKeepConverter())
    this.converters.add(new SimplenoteConverter())
    this.converters.add(new PlaintextConverter())
    this.converters.add(new EvernoteConverter(this._generateUuid))
    this.converters.add(new HTMLConverter())
    this.converters.add(new SuperConverter(this.superConverterService))
  }

  detectService = async (file: File): Promise<string | null> => {
    const content = await readFileAsText(file)

    const { ext } = parseFileName(file.name)

    for (const converter of this.converters) {
      const isCorrectType = converter.getSupportedFileTypes && converter.getSupportedFileTypes().includes(file.type)
      const isCorrectExtension = converter.getFileExtension && converter.getFileExtension() === ext

      if (!isCorrectType && !isCorrectExtension) {
        continue
      }

      if (converter.isContentValid(content)) {
        return converter.getImportType()
      }
    }

    return null
  }

  insertNote: InsertNoteFn = async ({
    createdAt,
    updatedAt,
    title,
    text,
    noteType,
    editorIdentifier,
    trashed = false,
    archived = false,
    pinned = false,
    useSuperIfPossible,
  }) => {
    if (noteType === NoteType.Super && !this.isEntitledToSuper()) {
      noteType = undefined
    }

    if (
      editorIdentifier &&
      this.features.getFeatureStatus(NativeFeatureIdentifier.create(editorIdentifier).getValue()) !==
        FeatureStatus.Entitled
    ) {
      editorIdentifier = undefined
    }

    const shouldUseSuper = useSuperIfPossible && this.isEntitledToSuper()

    const note = this.items.createTemplateItem<NoteContent, SNNote>(
      ContentType.TYPES.Note,
      {
        title,
        text,
        references: [],
        noteType: shouldUseSuper ? NoteType.Super : noteType,
        trashed,
        archived,
        pinned,
        editorIdentifier: shouldUseSuper ? NativeFeatureIdentifier.TYPES.SuperEditor : editorIdentifier,
      },
      {
        created_at: createdAt,
        updated_at: updatedAt,
      },
    )

    return await this.mutator.insertItem(note)
  }

  insertTag: InsertTagFn = async ({ createdAt, updatedAt, title, references }) => {
    const tag = this.items.createTemplateItem<TagContent, SNTag>(
      ContentType.TYPES.Tag,
      {
        title,
        expanded: false,
        iconString: '',
        references,
      },
      {
        created_at: createdAt,
        updated_at: updatedAt,
      },
    )

    return await this.mutator.insertItem(tag)
  }

  linkItems: LinkItemsFn = async (item, itemToLink) => {
    await this.linkingController.linkItems(item, itemToLink, false)
  }

  isEntitledToSuper = (): boolean => {
    return (
      this.features.getFeatureStatus(
        NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.SuperEditor).getValue(),
      ) === FeatureStatus.Entitled
    )
  }

  convertHTMLToSuper = (html: string): string => {
    if (!this.isEntitledToSuper()) {
      return html
    }

    return this.superConverterService.convertOtherFormatToSuperString(html, 'html')
  }

  convertMarkdownToSuper = (markdown: string): string => {
    if (!this.isEntitledToSuper()) {
      return markdown
    }

    return this.superConverterService.convertOtherFormatToSuperString(markdown, 'md')
  }

  async importFromFile(file: File, type: string): Promise<DecryptedTransferPayload[]> {
    const isEntitledToSuper = this.isEntitledToSuper()

    if (type === 'super' && !isEntitledToSuper) {
      throw new Error('Importing Super notes requires a subscription')
    }

    for (const converter of this.converters) {
      const isCorrectType = converter.getImportType() === type

      if (!isCorrectType) {
        continue
      }

      const content = await readFileAsText(file)

      if (!converter.isContentValid(content)) {
        throw new Error('Content is not valid')
      }

      await converter.convert(file, {
        insertNote: this.insertNote,
        insertTag: this.insertTag,
        canUseSuper: isEntitledToSuper,
        convertHTMLToSuper: this.convertHTMLToSuper,
        convertMarkdownToSuper: this.convertMarkdownToSuper,
        readFileAsText,
        linkItems: this.linkItems,
      })
    }

    return []
  }

  async uploadAndReplaceInlineFilesInInsertedItems(insertedItems: DecryptedItemInterface<ItemContent>[]) {
    for (const item of insertedItems) {
      if (!isNote(item)) {
        continue
      }
      if (item.noteType !== NoteType.Super) {
        continue
      }
      try {
        const text = await this.superConverterService.uploadAndReplaceInlineFilesInSuperString(
          item.text,
          async (file) => await this.filesController.uploadNewFile(file, { showToast: true, note: item }),
          async (file) => await this.linkingController.linkItems(item, file, false),
          this._generateUuid,
        )
        await this.mutator.changeItem<NoteMutator>(item, (mutator) => {
          mutator.text = text
        })
      } catch (error) {
        console.error(error)
      }
    }
  }
}
