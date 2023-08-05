import { ContentType } from '@standardnotes/domain-core'
import { DecryptedTransferPayload, NoteContent } from '@standardnotes/models'
import { readFileAsText } from '../Utils'
import { UuidGenerator } from '@standardnotes/utils'

type GoogleKeepJsonNote = {
  color: string
  isTrashed: boolean
  isPinned: boolean
  isArchived: boolean
  textContent: string
  title: string
  userEditedTimestampUsec: number
}

export class GoogleKeepConverter {
  constructor() {}

  async convertGoogleKeepBackupFileToNote(
    file: File,
    stripHtml: boolean,
  ): Promise<DecryptedTransferPayload<NoteContent>> {
    const content = await readFileAsText(file)

    const possiblePayloadFromJson = this.tryParseAsJson(content)

    if (possiblePayloadFromJson) {
      return possiblePayloadFromJson
    }

    const possiblePayloadFromHtml = this.tryParseAsHtml(content, file, stripHtml)

    if (possiblePayloadFromHtml) {
      return possiblePayloadFromHtml
    }

    throw new Error('Could not parse Google Keep backup file')
  }

  tryParseAsHtml(data: string, file: { name: string }, stripHtml: boolean): DecryptedTransferPayload<NoteContent> {
    const rootElement = document.createElement('html')
    rootElement.innerHTML = data

    const contentElement = rootElement.getElementsByClassName('content')[0]
    let content: string | null

    // Replace <br> with \n so line breaks get recognised
    contentElement.innerHTML = contentElement.innerHTML.replace(/<br>/g, '\n')

    if (stripHtml) {
      content = contentElement.textContent
    } else {
      content = contentElement.innerHTML
    }

    if (!content) {
      throw new Error('Could not parse content')
    }

    const title = rootElement.getElementsByClassName('title')[0]?.textContent || file.name

    const date = this.getDateFromGKeepNote(data) || new Date()

    return {
      created_at: date,
      created_at_timestamp: date.getTime(),
      updated_at: date,
      updated_at_timestamp: date.getTime(),
      uuid: UuidGenerator.GenerateUuid(),
      content_type: ContentType.TYPES.Note,
      content: {
        title: title,
        text: content,
        references: [],
      },
    }
  }

  getDateFromGKeepNote(note: string) {
    const regexWithTitle = /.*(?=<\/div>\n<div class="title">)/
    const regexWithoutTitle = /.*(?=<\/div>\n\n<div class="content">)/
    const possibleDateStringWithTitle = regexWithTitle.exec(note)?.[0]
    const possibleDateStringWithoutTitle = regexWithoutTitle.exec(note)?.[0]
    if (possibleDateStringWithTitle) {
      const date = new Date(possibleDateStringWithTitle)
      if (date.toString() !== 'Invalid Date' && date.toString() !== 'NaN') {
        return date
      }
    }
    if (possibleDateStringWithoutTitle) {
      const date = new Date(possibleDateStringWithoutTitle)
      if (date.toString() !== 'Invalid Date' && date.toString() !== 'NaN') {
        return date
      }
    }
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static isValidGoogleKeepJson(json: any): boolean {
    return (
      typeof json.title === 'string' &&
      typeof json.textContent === 'string' &&
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
      return {
        created_at: date,
        created_at_timestamp: date.getTime(),
        updated_at: date,
        updated_at_timestamp: date.getTime(),
        uuid: UuidGenerator.GenerateUuid(),
        content_type: ContentType.TYPES.Note,
        content: {
          title: parsed.title,
          text: parsed.textContent,
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
