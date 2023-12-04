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
  isNote,
} from '@standardnotes/models'
import { HTMLConverter } from './HTMLConverter/HTMLConverter'
import { SuperConverter } from './SuperConverter/SuperConverter'
import { Converter, CreateNoteFn, CreateTagFn } from './Converter'
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

  createNote: CreateNoteFn = ({
    createdAt,
    updatedAt,
    title,
    text,
    noteType,
    editorIdentifier,
    trashed,
    archived,
    pinned,
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

    return {
      created_at: createdAt,
      created_at_timestamp: createdAt.getTime(),
      updated_at: updatedAt,
      updated_at_timestamp: updatedAt.getTime(),
      uuid: this._generateUuid.execute().getValue(),
      content_type: ContentType.TYPES.Note,
      content: {
        title,
        text,
        references: [],
        noteType,
        trashed,
        archived,
        pinned,
        editorIdentifier,
      },
    }
  }

  createTag: CreateTagFn = ({ createdAt, updatedAt, title }) => {
    return {
      uuid: this._generateUuid.execute().getValue(),
      content_type: ContentType.TYPES.Tag,
      created_at: createdAt,
      created_at_timestamp: createdAt.getTime(),
      updated_at: updatedAt,
      updated_at_timestamp: updatedAt.getTime(),
      content: {
        title: title,
        expanded: false,
        iconString: '',
        references: [],
      },
    }
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

  async getPayloadsFromFile(file: File, type: string): Promise<DecryptedTransferPayload[]> {
    const isEntitledToSuper =
      this.features.getFeatureStatus(
        NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.SuperEditor).getValue(),
      ) === FeatureStatus.Entitled

    if (type === 'super' && !isEntitledToSuper) {
      throw new Error('Importing Super notes requires a subscription')
    }

    for (const converter of this.converters) {
      const isCorrectType = converter.getImportType() === type

      if (!isCorrectType) {
        continue
      }

      return await converter.convert(file, {
        createNote: this.createNote,
        createTag: this.createTag,
        canUseSuper: isEntitledToSuper,
        convertHTMLToSuper: this.convertHTMLToSuper,
        convertMarkdownToSuper: this.convertMarkdownToSuper,
      })
    }

    return []
  }

  async importFromTransferPayloads(payloads: DecryptedTransferPayload[]) {
    const insertedItems = await Promise.all(
      payloads.map(async (payload) => {
        const content = payload.content as NoteContent
        const note = this.items.createTemplateItem(
          payload.content_type,
          {
            text: content.text,
            title: content.title,
            noteType: content.noteType,
            editorIdentifier: content.editorIdentifier,
            references: content.references,
          },
          {
            created_at: payload.created_at,
            updated_at: payload.updated_at,
            uuid: payload.uuid,
          },
        )
        return this.mutator.insertItem(note)
      }),
    )
    return insertedItems
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
          async (file) => await this.linkingController.linkItems(item, file),
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
