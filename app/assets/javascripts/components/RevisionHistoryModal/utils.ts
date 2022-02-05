import { DAYS_IN_A_WEEK, DAYS_IN_A_YEAR } from '@/views/constants';
import {
  NoteHistoryEntry,
  RevisionListEntry,
} from '@standardnotes/snjs/dist/@types';
import { calculateDifferenceBetweenDatesInDays } from '../utils';

type RevisionEntry = RevisionListEntry | NoteHistoryEntry;

export type ListGroup<EntryType extends RevisionEntry> = {
  title: string;
  entries: EntryType[] | undefined;
};

export type RemoteRevisionListGroup = ListGroup<RevisionListEntry>;
export type SessionRevisionListGroup = ListGroup<NoteHistoryEntry>;

export const formatDateAsMonthYearString = (date: Date) =>
  date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

export const getGroupIndexForEntry = (
  entry: RevisionEntry,
  groups: ListGroup<RevisionEntry>[]
) => {
  const todayAsDate = new Date();
  const entryDate = new Date(
    (entry as RevisionListEntry).created_at ??
      (entry as NoteHistoryEntry).payload.created_at
  );

  const differenceBetweenDatesInDays = calculateDifferenceBetweenDatesInDays(
    todayAsDate,
    entryDate
  );

  if (differenceBetweenDatesInDays === 0) {
    return groups.findIndex((group) => group.title === GROUP_TITLE_TODAY);
  }

  if (
    differenceBetweenDatesInDays > 0 &&
    differenceBetweenDatesInDays < DAYS_IN_A_WEEK
  ) {
    return groups.findIndex((group) => group.title === GROUP_TITLE_WEEK);
  }

  if (differenceBetweenDatesInDays > DAYS_IN_A_YEAR) {
    return groups.findIndex((group) => group.title === GROUP_TITLE_YEAR);
  }

  const formattedEntryMonthYear = formatDateAsMonthYearString(entryDate);

  return groups.findIndex((group) => group.title === formattedEntryMonthYear);
};

const GROUP_TITLE_TODAY = 'Today';
const GROUP_TITLE_WEEK = 'This Week';
const GROUP_TITLE_YEAR = 'More Than A Year Ago';

export const getInitialGroups = <T extends RevisionEntry>(): ListGroup<T>[] => [
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
];

export const sortRevisionListIntoGroups = <EntryType extends RevisionEntry>(
  revisionList: EntryType[] | undefined,
  initialGroups: ListGroup<EntryType>[]
) => {
  const sortedGroups = [...initialGroups];

  revisionList?.forEach((entry) => {
    const groupIndex = getGroupIndexForEntry(entry, initialGroups);

    if (groupIndex > -1) {
      initialGroups[groupIndex]?.entries?.push(entry);
    } else {
      initialGroups.push({
        title: formatDateAsMonthYearString(
          new Date(
            (entry as RevisionListEntry).created_at ??
              (entry as NoteHistoryEntry).payload.created_at
          )
        ),
        entries: [entry],
      });
    }
  });

  return sortedGroups;
};
