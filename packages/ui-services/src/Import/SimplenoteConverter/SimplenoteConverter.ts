import { Converter, InsertNoteFn } from '../Converter'

type SimplenoteItem = {
  creationDate: string
  lastModified: string
  content: string
}

type SimplenoteData = {
  activeNotes: SimplenoteItem[]
  trashedNotes: SimplenoteItem[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isSimplenoteEntry = (entry: any): boolean =>
  entry.id && entry.content != undefined && entry.creationDate && entry.lastModified

export class SimplenoteConverter implements Converter {
  constructor() {}

  getImportType(): string {
    return 'simplenote'
  }

  getSupportedFileTypes(): string[] {
    return ['application/json']
  }

  isContentValid(content: string): boolean {
    try {
      const json = JSON.parse(content)
      return (
        (json.activeNotes && json.activeNotes.every(isSimplenoteEntry)) ||
        (json.trashedNotes && json.trashedNotes.every(isSimplenoteEntry))
      )
    } catch (error) {
      console.error(error)
    }
    return false
  }

  convert: Converter['convert'] = async (file, { insertNote: createNote, readFileAsText }) => {
    const content = await readFileAsText(file)

    const notes = await this.parse(content, createNote)

    if (!notes) {
      throw new Error('Could not parse notes')
    }

    return {
      successful: notes,
      errored: [],
    }
  }

  createNoteFromItem(item: SimplenoteItem, trashed: boolean, createNote: InsertNoteFn): ReturnType<InsertNoteFn> {
    const createdAtDate = new Date(item.creationDate)
    const updatedAtDate = new Date(item.lastModified)

    const splitItemContent = item.content.split('\r\n')
    const hasTitleAndContent = splitItemContent.length === 2
    const title =
      hasTitleAndContent && splitItemContent[0].length ? splitItemContent[0] : createdAtDate.toLocaleString()
    const content = hasTitleAndContent && splitItemContent[1].length ? splitItemContent[1] : item.content

    return createNote({
      createdAt: createdAtDate,
      updatedAt: updatedAtDate,
      title,
      text: content,
      trashed,
      useSuperIfPossible: true,
    })
  }

  async parse(data: string, createNote: InsertNoteFn) {
    try {
      const parsed = JSON.parse(data) as SimplenoteData
      const activeNotes = await Promise.all(
        parsed.activeNotes.reverse().map((item) => this.createNoteFromItem(item, false, createNote)),
      )
      const trashedNotes = await Promise.all(
        parsed.trashedNotes.reverse().map((item) => this.createNoteFromItem(item, true, createNote)),
      )

      return [...activeNotes, ...trashedNotes]
    } catch (error) {
      console.error(error)
      return null
    }
  }
}
