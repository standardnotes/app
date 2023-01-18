import { DAYS_IN_A_WEEK, DAYS_IN_A_YEAR } from '@/Constants/Constants'
import { HistoryEntry, NoteHistoryEntry, RevisionMetadata } from '@standardnotes/snjs'
import { calculateDifferenceBetweenDatesInDays } from '../../Utils/CalculateDifferenceBetweenDatesInDays'

export type HistoryModalMobileTab = 'Content' | 'List'

export type LegacyHistoryEntry = {
  payload: HistoryEntry['payload']
  created_at: string
}

type RevisionEntry = RevisionMetadata | NoteHistoryEntry | LegacyHistoryEntry

export type ListGroup<EntryType extends RevisionEntry> = {
  title: string
  entries: EntryType[] | undefined
}

export type RemoteRevisionListGroup = ListGroup<RevisionMetadata>
export type SessionRevisionListGroup = ListGroup<NoteHistoryEntry>

export const formatDateAsMonthYearString = (date: Date) => {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export const getGroupIndexForEntry = (entry: RevisionEntry, groups: ListGroup<RevisionEntry>[]) => {
  const todayAsDate = new Date()
  const entryDate = new Date((entry as RevisionMetadata).created_at ?? (entry as NoteHistoryEntry).payload.updated_at)

  const differenceBetweenDatesInDays = calculateDifferenceBetweenDatesInDays(todayAsDate, entryDate)

  if (differenceBetweenDatesInDays === 0) {
    return groups.findIndex((group) => group.title === GROUP_TITLE_TODAY)
  }

  if (differenceBetweenDatesInDays > 0 && differenceBetweenDatesInDays < DAYS_IN_A_WEEK) {
    return groups.findIndex((group) => group.title === GROUP_TITLE_WEEK)
  }

  if (differenceBetweenDatesInDays > DAYS_IN_A_YEAR) {
    return groups.findIndex((group) => group.title === GROUP_TITLE_YEAR)
  }

  const formattedEntryMonthYear = formatDateAsMonthYearString(entryDate)

  return groups.findIndex((group) => group.title === formattedEntryMonthYear)
}

const GROUP_TITLE_TODAY = 'Today'
const GROUP_TITLE_WEEK = 'This Week'
const GROUP_TITLE_YEAR = 'More Than A Year Ago'

export const sortRevisionListIntoGroups = <EntryType extends RevisionEntry>(revisionList: EntryType[] | undefined) => {
  const sortedGroups: ListGroup<EntryType>[] = [
    {
      title: GROUP_TITLE_TODAY,
      entries: [],
    },
    {
      title: GROUP_TITLE_WEEK,
      entries: [],
    },
    {
      title: GROUP_TITLE_YEAR,
      entries: [],
    },
  ]

  const addBeforeLastGroup = (group: ListGroup<EntryType>) => {
    sortedGroups.splice(sortedGroups.length - 1, 0, group)
  }

  revisionList?.forEach((entry) => {
    const groupIndex = getGroupIndexForEntry(entry, sortedGroups)

    if (groupIndex > -1) {
      sortedGroups[groupIndex]?.entries?.push(entry)
    } else {
      addBeforeLastGroup({
        title: formatDateAsMonthYearString(
          new Date((entry as RevisionMetadata).created_at ?? (entry as NoteHistoryEntry).payload.updated_at),
        ),
        entries: [entry],
      })
    }
  })

  return sortedGroups
}

export const previewHistoryEntryTitle = (revision: RevisionMetadata | LegacyHistoryEntry) => {
  return new Date(revision.created_at).toLocaleString()
}
