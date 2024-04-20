import { SNNote } from '@standardnotes/models'
import { Converter, HTMLToSuperConverterFunction, InsertNoteFn } from '../Converter'

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

export class GoogleKeepConverter implements Converter {
  constructor() {}

  getImportType(): string {
    return 'google-keep'
  }

  getSupportedFileTypes(): string[] {
    return ['text/html', 'application/json']
  }

  isContentValid(content: string): boolean {
    try {
      const parsed = JSON.parse(content)
      return GoogleKeepConverter.isValidGoogleKeepJson(parsed)
    } catch (error) {
      console.error(error)
    }

    if (content.length > 0 && content.includes('class="content"')) {
      return true
    }

    return false
  }

  convert: Converter['convert'] = async (
    file,
    { insertNote: createNote, canUseSuper, convertHTMLToSuper, convertMarkdownToSuper, readFileAsText },
  ) => {
    const content = await readFileAsText(file)

    const note =
      (await this.tryParseAsJson(content, createNote, convertMarkdownToSuper)) ||
      (await this.tryParseAsHtml(content, file, createNote, convertHTMLToSuper, canUseSuper))

    if (note) {
      return {
        successful: [note],
        errored: [],
      }
    }

    throw new Error('Could not parse Google Keep backup file')
  }

  async tryParseAsHtml(
    data: string,
    file: { name: string },
    insertNote: InsertNoteFn,
    convertHTMLToSuper: HTMLToSuperConverterFunction,
    canUseSuper: boolean,
  ): Promise<SNNote> {
    const rootElement = document.createElement('html')
    rootElement.innerHTML = data

    const headingElement = rootElement.getElementsByClassName('heading')[0]
    const date = new Date(headingElement?.textContent || '')
    headingElement?.remove()

    const contentElement = rootElement.getElementsByClassName('content')[0]
    if (!contentElement) {
      throw new Error('Could not parse content. Content element not found.')
    }

    let content: string | null

    // Convert lists to readable plaintext format
    // or Super-convertable format
    const lists = contentElement.getElementsByTagName('ul')
    Array.from(lists).forEach((list) => {
      list.setAttribute('__lexicallisttype', 'check')

      const items = list.getElementsByTagName('li')
      Array.from(items).forEach((item) => {
        const bulletSpan = item.getElementsByClassName('bullet')[0]
        bulletSpan?.remove()

        const checked = item.classList.contains('checked')
        item.setAttribute('aria-checked', checked ? 'true' : 'false')

        if (!canUseSuper) {
          item.textContent = `- ${checked ? '[x]' : '[ ]'} ${item.textContent?.trim()}\n`
        }
      })
    })

    if (!canUseSuper) {
      // Replace <br> with \n so line breaks get recognised
      contentElement.innerHTML = contentElement.innerHTML.replace(/<br>/g, '\n')
      content = contentElement.textContent
    } else {
      content = convertHTMLToSuper(rootElement.innerHTML, {
        addLineBreaks: false,
      })
    }

    if (!content) {
      throw new Error('Could not parse content')
    }

    const title = rootElement.getElementsByClassName('title')[0]?.textContent || file.name

    return await insertNote({
      createdAt: date,
      updatedAt: date,
      title: title,
      text: content,
      useSuperIfPossible: true,
    })
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

  async tryParseAsJson(
    data: string,
    createNote: InsertNoteFn,
    convertMarkdownToSuper: (md: string) => string,
  ): Promise<SNNote | null> {
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
      text = convertMarkdownToSuper(text)
      return await createNote({
        createdAt: date,
        updatedAt: date,
        title: parsed.title,
        text,
        archived: Boolean(parsed.isArchived),
        trashed: Boolean(parsed.isTrashed),
        pinned: Boolean(parsed.isPinned),
        useSuperIfPossible: true,
      })
    } catch (e) {
      console.error(e)
      return null
    }
  }
}
