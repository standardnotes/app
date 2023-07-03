import { DecryptedTransferPayload, NoteContent } from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'
import { readFileAsText } from '../Utils'
import { FeatureIdentifier, NoteType } from '@standardnotes/features'
import { WebApplicationInterface } from '../../WebApplication/WebApplicationInterface'

type AegisData = {
  db: {
    entries: {
      issuer: string
      name: string
      info: {
        secret: string
      }
      note: string
    }[]
  }
}

const AegisEntryTypes = ['hotp', 'totp', 'steam', 'yandex'] as const

type AuthenticatorEntry = {
  service: string
  account: string
  secret: string
  notes: string
}

export class AegisToAuthenticatorConverter {
  constructor(protected application: WebApplicationInterface) {}

  static isValidAegisJson(json: any): boolean {
    return json.db && json.db.entries && json.db.entries.every((entry: any) => AegisEntryTypes.includes(entry.type))
  }

  async convertAegisBackupFileToNote(
    file: File,
    addEditorInfo: boolean,
  ): Promise<DecryptedTransferPayload<NoteContent>> {
    const content = await readFileAsText(file)

    const entries = this.parseEntries(content)

    if (!entries) {
      throw new Error('Could not parse entries')
    }

    return this.createNoteFromEntries(entries, file, addEditorInfo)
  }

  createNoteFromEntries(
    entries: AuthenticatorEntry[],
    file: {
      lastModified: number
      name: string
    },
    addEditorInfo: boolean,
  ): DecryptedTransferPayload<NoteContent> {
    return {
      created_at: new Date(file.lastModified),
      created_at_timestamp: file.lastModified,
      updated_at: new Date(file.lastModified),
      updated_at_timestamp: file.lastModified,
      uuid: this.application.generateUUID(),
      content_type: ContentType.Note,
      content: {
        title: file.name.split('.')[0],
        text: JSON.stringify(entries),
        references: [],
        ...(addEditorInfo && {
          noteType: NoteType.Authentication,
          editorIdentifier: FeatureIdentifier.TokenVaultEditor,
        }),
      },
    }
  }

  parseEntries(data: string): AuthenticatorEntry[] | null {
    try {
      const json = JSON.parse(data) as AegisData
      const entries = json.db.entries.map((entry) => {
        return {
          service: entry.issuer,
          account: entry.name,
          secret: entry.info.secret,
          notes: entry.note,
        } as AuthenticatorEntry
      })
      return entries
    } catch (error) {
      console.error(error)
      return null
    }
  }
}
