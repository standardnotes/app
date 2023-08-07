import { parseFileName } from '@standardnotes/filepicker'
import {
  FeatureStatus,
  FeaturesClientInterface,
  GenerateUuid,
  ItemManagerInterface,
  MutatorClientInterface,
} from '@standardnotes/services'
import { NativeFeatureIdentifier } from '@standardnotes/features'
import { AegisToAuthenticatorConverter } from './AegisConverter/AegisToAuthenticatorConverter'
import { EvernoteConverter } from './EvernoteConverter/EvernoteConverter'
import { GoogleKeepConverter } from './GoogleKeepConverter/GoogleKeepConverter'
import { PlaintextConverter } from './PlaintextConverter/PlaintextConverter'
import { SimplenoteConverter } from './SimplenoteConverter/SimplenoteConverter'
import { readFileAsText } from './Utils'
import { DecryptedTransferPayload, NoteContent } from '@standardnotes/models'

export type NoteImportType = 'plaintext' | 'evernote' | 'google-keep' | 'simplenote' | 'aegis'

export class Importer {
  aegisConverter: AegisToAuthenticatorConverter
  googleKeepConverter: GoogleKeepConverter
  simplenoteConverter: SimplenoteConverter
  plaintextConverter: PlaintextConverter
  evernoteConverter: EvernoteConverter

  constructor(
    private features: FeaturesClientInterface,
    private mutator: MutatorClientInterface,
    private items: ItemManagerInterface,
    _generateUuid: GenerateUuid,
  ) {
    this.aegisConverter = new AegisToAuthenticatorConverter(_generateUuid)
    this.googleKeepConverter = new GoogleKeepConverter(_generateUuid)
    this.simplenoteConverter = new SimplenoteConverter(_generateUuid)
    this.plaintextConverter = new PlaintextConverter(_generateUuid)
    this.evernoteConverter = new EvernoteConverter(_generateUuid)
  }

  static detectService = async (file: File): Promise<NoteImportType | null> => {
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

    if (PlaintextConverter.isValidPlaintextFile(file)) {
      return 'plaintext'
    }

    return null
  }

  async getPayloadsFromFile(file: File, type: NoteImportType): Promise<DecryptedTransferPayload[]> {
    if (type === 'aegis') {
      const isEntitledToAuthenticator =
        this.features.getFeatureStatus(
          NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.TokenVaultEditor).getValue(),
        ) === FeatureStatus.Entitled
      return [await this.aegisConverter.convertAegisBackupFileToNote(file, isEntitledToAuthenticator)]
    } else if (type === 'google-keep') {
      return [await this.googleKeepConverter.convertGoogleKeepBackupFileToNote(file, true)]
    } else if (type === 'simplenote') {
      return await this.simplenoteConverter.convertSimplenoteBackupFileToNotes(file)
    } else if (type === 'evernote') {
      return await this.evernoteConverter.convertENEXFileToNotesAndTags(file, false)
    } else if (type === 'plaintext') {
      return [await this.plaintextConverter.convertPlaintextFileToNote(file)]
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
}
