import { ContentType } from '@standardnotes/domain-core'
import { DecryptedTransferPayload, NoteContent } from '@standardnotes/models'
import { readFileAsText } from '../Utils'
import { GenerateUuid } from '@standardnotes/services'
import { SuperConverterServiceInterface } from '@standardnotes/files'
import { NativeFeatureIdentifier, NoteType } from '@standardnotes/features'

type Content =
  | {
      textContent: string
    }
  | {
      listContent: {
        text: string
        isChecked: boolean
      }[]
    }

type GoogleKeepJsonNote = {
  color: string
  isTrashed: boolean
  isPinned: boolean
  isArchived: boolean
  title: string
  userEditedTimestampUsec: number
} & Content

export class GoogleKeepConverter {
  constructor(
    private superConverterService: SuperConverterServiceInterface,
    private _generateUuid: GenerateUuid,
  ) {}

  async convertGoogleKeepBackupFileToNote(
    file: File,
    isEntitledToSuper: boolean,
  ): Promise<DecryptedTransferPayload<NoteContent>> {
    const content = await readFileAsText(file)

    const possiblePayloadFromJson = this.tryParseAsJson(content)

    if (possiblePayloadFromJson) {
      return possiblePayloadFromJson
    }

    const possiblePayloadFromHtml = this.tryParseAsHtml(content, file, isEntitledToSuper)

    if (possiblePayloadFromHtml) {
      return possiblePayloadFromHtml
    }

    throw new Error('Could not parse Google Keep backup file')
  }

  tryParseAsHtml(
    data: string,
    file: { name: string },
    isEntitledToSuper: boolean,
  ): DecryptedTransferPayload<NoteContent> {
    const rootElement = document.createElement('html')
    rootElement.innerHTML = data

    const headingElement = rootElement.getElementsByClassName('heading')[0]
    const date = new Date(headingElement?.textContent || '')
    headingElement?.remove()

    const contentElement = rootElement.getElementsByClassName('content')[0]
    let content: string | null

    if (!isEntitledToSuper) {
      // Replace <br> with \n so line breaks get recognised
      contentElement.innerHTML = contentElement.innerHTML.replace(/<br>/g, '\n')
      content = contentElement.textContent
    } else {
      content = this.superConverterService.convertOtherFormatToSuperString(rootElement.innerHTML, 'html')
    }

    if (!content) {
      throw new Error('Could not parse content')
    }

    const title = rootElement.getElementsByClassName('title')[0]?.textContent || file.name

    return {
      created_at: date,
      created_at_timestamp: date.getTime(),
      updated_at: date,
      updated_at_timestamp: date.getTime(),
      uuid: this._generateUuid.execute().getValue(),
      content_type: ContentType.TYPES.Note,
      content: {
        title: title,
        text: content,
        references: [],
        ...(isEntitledToSuper
          ? {
              noteType: NoteType.Super,
              editorIdentifier: NativeFeatureIdentifier.TYPES.SuperEditor,
            }
          : {}),
      },
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static isValidGoogleKeepJson(json: any): boolean {
    if (typeof json.textContent !== 'string') {
      if (typeof json.listContent === 'object' && Array.isArray(json.listContent)) {
        return json.listContent.every(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: any) => typeof item.text === 'string' && typeof item.isChecked === 'boolean',
        )
      }
      return false
    }

    return (
      typeof json.title === 'string' &&
      typeof json.userEditedTimestampUsec === 'number' &&
      typeof json.isArchived === 'boolean' &&
      typeof json.isTrashed === 'boolean' &&
      typeof json.isPinned === 'boolean' &&
      typeof json.color === 'string'
    )
  }

  tryParseAsJson(data: string): DecryptedTransferPayload<NoteContent> | null {
    try {
      const parsed = JSON.parse(data) as GoogleKeepJsonNote
      if (!GoogleKeepConverter.isValidGoogleKeepJson(parsed)) {
        return null
      }
      const date = new Date(parsed.userEditedTimestampUsec / 1000)
      let text: string
      if ('textContent' in parsed) {
        text = parsed.textContent
      } else {
        text = parsed.listContent
          .map((item) => {
            return item.isChecked ? `- [x] ${item.text}` : `- [ ] ${item.text}`
          })
          .join('\n')
      }
      return {
        created_at: date,
        created_at_timestamp: date.getTime(),
        updated_at: date,
        updated_at_timestamp: date.getTime(),
        uuid: this._generateUuid.execute().getValue(),
        content_type: ContentType.TYPES.Note,
        content: {
          title: parsed.title,
          text,
          references: [],
          archived: Boolean(parsed.isArchived),
          trashed: Boolean(parsed.isTrashed),
          pinned: Boolean(parsed.isPinned),
        },
      }
    } catch (e) {
      return null
    }
  }
}
