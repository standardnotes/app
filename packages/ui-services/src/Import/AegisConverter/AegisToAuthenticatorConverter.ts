import { DecryptedTransferPayload, NoteContent } from '@standardnotes/models'
import { readFileAsText } from '../Utils'
import { NativeFeatureIdentifier, NoteType } from '@standardnotes/features'
import { ContentType } from '@standardnotes/domain-core'
import { GenerateUuid } from '@standardnotes/services'
import { Converter } from '../Converter'

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

export class AegisToAuthenticatorConverter implements Converter {
  constructor(private _generateUuid: GenerateUuid) {}

  getImportType(): string {
    return 'aegis'
  }

  getSupportedFileTypes(): string[] {
    return ['application/json']
  }

  isContentValid: (content: string) => boolean = AegisToAuthenticatorConverter.isValidAegisJson

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static isValidAegisJson(json: any): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      uuid: this._generateUuid.execute().getValue(),
      content_type: ContentType.TYPES.Note,
      content: {
        title: file.name.split('.')[0],
        text: JSON.stringify(entries),
        references: [],
        ...(addEditorInfo && {
          noteType: NoteType.Authentication,
          editorIdentifier: NativeFeatureIdentifier.TYPES.TokenVaultEditor,
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
