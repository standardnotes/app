import { NativeFeatureIdentifier, NoteType } from '@standardnotes/features'
import { Converter } from '../Converter'
import { ConversionResult } from '../ConversionResult'

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
  constructor() {}

  getImportType(): string {
    return 'aegis'
  }

  getSupportedFileTypes(): string[] {
    return ['application/json']
  }

  isContentValid(content: string): boolean {
    try {
      const json = JSON.parse(content)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return json.db && json.db.entries && json.db.entries.every((entry: any) => AegisEntryTypes.includes(entry.type))
    } catch (error) {
      console.error(error)
    }
    return false
  }

  convert: Converter['convert'] = async (file, { insertNote, readFileAsText }) => {
    const content = await readFileAsText(file)

    const entries = this.parseEntries(content)

    if (!entries) {
      throw new Error('Could not parse entries')
    }

    const createdAt = file.lastModified ? new Date(file.lastModified) : new Date()
    const updatedAt = file.lastModified ? new Date(file.lastModified) : new Date()
    const title = file.name.split('.')[0]
    const text = JSON.stringify(entries)

    const note = await insertNote({
      createdAt,
      updatedAt,
      title,
      text,
      noteType: NoteType.Authentication,
      editorIdentifier: NativeFeatureIdentifier.TYPES.TokenVaultEditor,
      useSuperIfPossible: false,
    })

    const successful: ConversionResult['successful'] = [note]

    return {
      successful,
      errored: [],
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
