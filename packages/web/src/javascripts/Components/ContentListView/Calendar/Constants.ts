import { c } from 'ttag'

export const CalendarDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
export const CalendarDaysLeap = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export const getCalendarDaysOfTheWeek = () => [
  c('B3.Notes.NoteList.Label').t`Mo`,
  c('B3.Notes.NoteList.Label').t`Tu`,
  c('B3.Notes.NoteList.Label').t`We`,
  c('B3.Notes.NoteList.Label').t`Th`,
  c('B3.Notes.NoteList.Label').t`Fr`,
  c('B3.Notes.NoteList.Label').t`Sa`,
  c('B3.Notes.NoteList.Label').t`Su`,
]

export const getCalendarMonths = () => [
  c('B3.Notes.NoteList.Label').t`January`,
  c('B3.Notes.NoteList.Label').t`February`,
  c('B3.Notes.NoteList.Label').t`March`,
  c('B3.Notes.NoteList.Label').t`April`,
  c('B3.Notes.NoteList.Label').t`May`,
  c('B3.Notes.NoteList.Label').t`June`,
  c('B3.Notes.NoteList.Label').t`July`,
  c('B3.Notes.NoteList.Label').t`August`,
  c('B3.Notes.NoteList.Label').t`September`,
  c('B3.Notes.NoteList.Label').t`October`,
  c('B3.Notes.NoteList.Label').t`November`,
  c('B3.Notes.NoteList.Label').t`December`,
]
