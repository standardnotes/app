import { parseFileName } from '@standardnotes/filepicker'
import { FeatureStatus } from '@standardnotes/services'
import { FeatureIdentifier } from '@standardnotes/features'
import { AegisToAuthenticatorConverter } from './AegisConverter/AegisToAuthenticatorConverter'
import { EvernoteConverter } from './EvernoteConverter/EvernoteConverter'
import { GoogleKeepConverter } from './GoogleKeepConverter/GoogleKeepConverter'
import { PlaintextConverter } from './PlaintextConverter/PlaintextConverter'
import { SimplenoteConverter } from './SimplenoteConverter/SimplenoteConverter'
import { readFileAsText } from './Utils'
import { DecryptedTransferPayload, NoteContent } from '@standardnotes/models'
import { WebApplicationInterface } from '../WebApplication/WebApplicationInterface'

export type NoteImportType = 'plaintext' | 'evernote' | 'google-keep' | 'simplenote' | 'aegis'

export class Importer {
  aegisConverter: AegisToAuthenticatorConverter
  googleKeepConverter: GoogleKeepConverter
  simplenoteConverter: SimplenoteConverter
  plaintextConverter: PlaintextConverter
  evernoteConverter: EvernoteConverter

  constructor(protected application: WebApplicationInterface) {
    this.aegisConverter = new AegisToAuthenticatorConverter(application)
    this.googleKeepConverter = new GoogleKeepConverter(application)
    this.simplenoteConverter = new SimplenoteConverter(application)
    this.plaintextConverter = new PlaintextConverter(application)
    this.evernoteConverter = new EvernoteConverter(application)
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
        this.application.features.getFeatureStatus(FeatureIdentifier.TokenVaultEditor) === FeatureStatus.Entitled
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
        const note = this.application.mutator.createTemplateItem(
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
        return this.application.mutator.insertItem(note)
      }),
    )
    return insertedItems
  }
}
