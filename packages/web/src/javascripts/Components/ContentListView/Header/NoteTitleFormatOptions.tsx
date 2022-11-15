import { NewNoteTitleFormat } from '@standardnotes/snjs'

export const NoteTitleFormatOptions = [
  {
    label: 'Current date and time',
    value: NewNoteTitleFormat.CurrentDateAndTime,
  },
  {
    label: 'Current note count',
    value: NewNoteTitleFormat.CurrentNoteCount,
  },
  {
    label: 'Custom format',
    value: NewNoteTitleFormat.CustomFormat,
  },
  {
    label: 'Empty',
    value: NewNoteTitleFormat.Empty,
  },
]
