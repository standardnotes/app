import { ContentType } from '@standardnotes/common'
import * as Models from '@standardnotes/models'

export const createNote = (payload?: Partial<Models.NoteContent>): Models.SNNote => {
  return new Models.SNNote(
    new Models.DecryptedPayload(
      {
        uuid: String(Math.random()),
        content_type: ContentType.Note,
        content: Models.FillItemContent({ ...payload }),
        ...Models.PayloadTimestampDefaults(),
      },
      Models.PayloadSource.Constructor,
    ),
  )
}

export const createNoteWithTitle = (title: string) => {
  return new Models.SNNote(
    new Models.DecryptedPayload({
      uuid: String(Math.random()),
      content_type: ContentType.Note,
      content: Models.FillItemContent<Models.NoteContent>({
        title: title,
      }),
      ...Models.PayloadTimestampDefaults(),
    }),
  )
}
