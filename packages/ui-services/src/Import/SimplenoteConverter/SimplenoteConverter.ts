import { UuidGenerator } from '@standardnotes/utils'

type SimplenoteItem = {
  creationDate: string
  lastModified: string
  content: string
}

type SimplenoteData = {
  activeNotes: SimplenoteItem[]
  trashedNotes: SimplenoteItem[]
}

export class SimplenoteConverter {
  createNoteFromItem(item: SimplenoteItem, trashed: boolean) {
    const createdAtDate = new Date(item.creationDate)
    const updatedAtDate = new Date(item.lastModified)

    const splitItemContent = item.content.split('\r\n')
    const hasTitleAndContent = splitItemContent.length === 2
    const title =
      hasTitleAndContent && splitItemContent[0].length ? splitItemContent[0] : createdAtDate.toLocaleString()
    const content = hasTitleAndContent && splitItemContent[1].length ? splitItemContent[1] : item.content

    return {
      created_at: createdAtDate,
      updated_at: updatedAtDate,
      uuid: UuidGenerator.GenerateUuid(),
      content_type: 'Note',
      content: {
        title,
        text: content,
        references: [],
        appData: {
          'org.standardnotes.sn': {
            client_updated_at: updatedAtDate,
            trashed,
          },
        },
      },
    }
  }

  parse(data: string) {
    try {
      const parsed = JSON.parse(data) as SimplenoteData
      const activeNotes = parsed.activeNotes.reverse().map((item) => this.createNoteFromItem(item, false))
      const trashedNotes = parsed.trashedNotes.reverse().map((item) => this.createNoteFromItem(item, true))

      return [...activeNotes, ...trashedNotes]
    } catch (error) {
      console.error(error)
      return null
    }
  }
}
