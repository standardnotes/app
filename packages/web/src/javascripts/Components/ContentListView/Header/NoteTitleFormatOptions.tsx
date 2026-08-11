import { NewNoteTitleFormat } from '@standardnotes/snjs'
import { c } from 'ttag'

export const NoteTitleFormatOptions = [
  {
    label: c('B3.Notes.NoteList.Label').t`Current date and time`,
    value: NewNoteTitleFormat.CurrentDateAndTime,
  },
  {
    label: c('B3.Notes.NoteList.Label').t`Current note count`,
    value: NewNoteTitleFormat.CurrentNoteCount,
  },
  {
    label: c('B3.Notes.NoteList.Label').t`Custom format`,
    value: NewNoteTitleFormat.CustomFormat,
  },
  {
    label: c('B3.Notes.NoteList.Label').t`Empty`,
    value: NewNoteTitleFormat.Empty,
  },
]
