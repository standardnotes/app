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
import { SuperConverterServiceInterface } from '@standardnotes/snjs/dist/@types'
import { SuperConverter } from './SuperConverter/SuperConverter'

export type NoteImportType = 'plaintext' | 'evernote' | 'google-keep' | 'simplenote' | 'aegis' | 'html' | 'super'

export class Importer {
  aegisConverter: AegisToAuthenticatorConverter
  googleKeepConverter: GoogleKeepConverter
  simplenoteConverter: SimplenoteConverter
  plaintextConverter: PlaintextConverter
  evernoteConverter: EvernoteConverter
  htmlConverter: HTMLConverter
  superConverter: SuperConverter

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
    this.aegisConverter = new AegisToAuthenticatorConverter(_generateUuid)
    this.googleKeepConverter = new GoogleKeepConverter(this.superConverterService, _generateUuid)
    this.simplenoteConverter = new SimplenoteConverter(_generateUuid)
    this.plaintextConverter = new PlaintextConverter(_generateUuid)
    this.evernoteConverter = new EvernoteConverter(this.superConverterService, _generateUuid)
    this.htmlConverter = new HTMLConverter(this.superConverterService, _generateUuid)
    this.superConverter = new SuperConverter(this.superConverterService, _generateUuid)
  }

  detectService = async (file: File): Promise<NoteImportType | null> => {
    const content = await readFileAsText(file)

    const { ext } = parseFileName(file.name)

    if (ext === 'enex') {
      return 'evernote'
    }

    try {
      const json = JSON.parse(content)

      if (AegisToAuthenticatorConverter.isValidAegisJson(json)) {
        return 'aegis'
      }

      if (GoogleKeepConverter.isValidGoogleKeepJson(json)) {
        return 'google-keep'
      }

      if (SimplenoteConverter.isValidSimplenoteJson(json)) {
        return 'simplenote'
      }
    } catch {
      /* empty */
    }

    if (file.type === 'application/json' && this.superConverterService.isValidSuperString(content)) {
      return 'super'
    }

    if (PlaintextConverter.isValidPlaintextFile(file)) {
      return 'plaintext'
    }

    if (HTMLConverter.isHTMLFile(file)) {
      return 'html'
    }

    return null
  }

  async getPayloadsFromFile(file: File, type: NoteImportType): Promise<DecryptedTransferPayload[]> {
    const isEntitledToSuper =
      this.features.getFeatureStatus(
        NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.SuperEditor).getValue(),
      ) === FeatureStatus.Entitled
    if (type === 'super') {
      if (!isEntitledToSuper) {
        throw new Error('Importing Super notes requires a subscription.')
      }
      return [await this.superConverter.convertSuperFileToNote(file)]
    } else if (type === 'aegis') {
      const isEntitledToAuthenticator =
        this.features.getFeatureStatus(
          NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.TokenVaultEditor).getValue(),
        ) === FeatureStatus.Entitled
      return [await this.aegisConverter.convertAegisBackupFileToNote(file, isEntitledToAuthenticator)]
    } else if (type === 'google-keep') {
      return [await this.googleKeepConverter.convertGoogleKeepBackupFileToNote(file, isEntitledToSuper)]
    } else if (type === 'simplenote') {
      return await this.simplenoteConverter.convertSimplenoteBackupFileToNotes(file)
    } else if (type === 'evernote') {
      return await this.evernoteConverter.convertENEXFileToNotesAndTags(file, isEntitledToSuper)
    } else if (type === 'plaintext') {
      return [await this.plaintextConverter.convertPlaintextFileToNote(file)]
    } else if (type === 'html') {
      return [await this.htmlConverter.convertHTMLFileToNote(file, isEntitledToSuper)]
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
    return insertedItems
  }
}
