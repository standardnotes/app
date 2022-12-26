import { UuidGenerator } from '@standardnotes/utils'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const dateFormat = 'YYYYMMDDTHHmmss'

export class SimplenoteConverter {
  parse(data: string, filename: string) {
    const processParsedNotes = (
      notes: {
        creationDate: string
        lastModified: string
        content: string
      }[],
      trashed = false,
    ) => {
      return notes.reverse().map((noteItem) => {
        const createDate = dayjs.utc(noteItem.creationDate, dateFormat).toDate()
        const updateDate = dayjs.utc(noteItem.lastModified, dateFormat).toDate()
        const noteContent = noteItem.content.split('\r\n')

        let title
        let content

        if (noteContent.length === 2 && noteContent[1].length > 0) {
          title = noteContent[0]
          content = noteContent[1]
        } else {
          title = filename.split('.')[0]
          content = noteItem.content
        }

        return {
          created_at: createDate,
          updated_at: updateDate,
          uuid: UuidGenerator.GenerateUuid(),
          content_type: 'Note',
          content: {
            title,
            text: content,
            references: [],
            appData: {
              'org.standardnotes.sn': {
                client_updated_at: updateDate,
                trashed,
              },
            },
          },
        }
      })
    }

    try {
      const parsed = JSON.parse(data)
      const activeNotes = processParsedNotes(parsed.activeNotes)
      const trashedNotes = processParsedNotes(parsed.trashedNotes, true)

      return [...activeNotes, ...trashedNotes]
    } catch (e) {
      return null
    }
  }
}
