import { ListableContentItem } from '../Types/ListableContentItem'
import { addDays, getWeekdayName, numDaysBetweenDates } from '@/Utils/DateUtils'
import { DailyItemsDaySection } from './DailyItemsDaySection'
import { dailiesDateToSectionTitle } from './Utils'

const templateEntryForDate = (date: Date): DailyItemsDaySection => {
  const entryDateString = dailiesDateToSectionTitle(date)

  return {
    dateKey: entryDateString,
    date: date,
    day: date.getDate(),
    isToday: entryDateString === dailiesDateToSectionTitle(new Date()),
    id: entryDateString,
    weekday: getWeekdayName(date, 'short'),
  }
}

const entryForItem = (item: ListableContentItem): DailyItemsDaySection => {
  const entryDateString = dailiesDateToSectionTitle(item.created_at)

  return {
    dateKey: entryDateString,
    day: item.created_at.getDate(),
    date: item.created_at,
    items: [],
    isToday: entryDateString === dailiesDateToSectionTitle(new Date()),
    id: item.uuid,
    weekday: getWeekdayName(item.created_at, 'short'),
  }
}

const entriesForItems = (items: ListableContentItem[]): DailyItemsDaySection[] => {
  const entries: DailyItemsDaySection[] = []

  for (const item of items) {
    let entry = entries.find((candidate) => candidate.dateKey === dailiesDateToSectionTitle(item.created_at))
    if (!entry) {
      entry = entryForItem(item)
      entries.push(entry)
    }

    entry.items!.push(item)
  }

  entries.sort((a, b) => {
    return a.date > b.date ? -1 : b.date > a.date ? 1 : 0
  })

  return entries
}

const insertBlanksBetweenItemEntries = (entries: DailyItemsDaySection[]): void => {
  let index = 1
  let loop = true

  while (loop) {
    const earlierEntry = entries[index]
    const laterEntry = entries[index - 1]

    if (!earlierEntry || !laterEntry) {
      break
    }

    const numDaysBetween = numDaysBetweenDates(earlierEntry.date, laterEntry.date)

    for (let deltaFromEarlierEntry = 1; deltaFromEarlierEntry < numDaysBetween; deltaFromEarlierEntry++) {
      const templateEntry = templateEntryForDate(addDays(earlierEntry.date, deltaFromEarlierEntry))
      entries.splice(index, 0, templateEntry)
    }

    index += numDaysBetween

    loop = index < entries.length
  }
}

export function createDailySectionsWithTemplateInterstices(items: ListableContentItem[]): DailyItemsDaySection[] {
  const entries = entriesForItems(items)
  insertBlanksBetweenItemEntries(entries)
  return entries
}

/**
 * Modifies entries array in-place.
 */
export function insertBlanks(
  entries: DailyItemsDaySection[],
  location: 'front' | 'end',
  number: number,
): DailyItemsDaySection[] {
  let laterDay, earlierDay

  if (entries.length > 0) {
    laterDay = entries[0].date
    earlierDay = entries[entries.length - 1].date
  } else {
    const today = new Date()
    laterDay = today
    earlierDay = today
  }

  for (let i = 1; i <= number; i++) {
    if (location === 'front') {
      const plusNFromFirstDay = addDays(laterDay, i)
      const futureEntry = templateEntryForDate(plusNFromFirstDay)
      entries.unshift(futureEntry)
    } else {
      const minusNFromLastDay = addDays(earlierDay, -i)
      const pastEntry = templateEntryForDate(minusNFromLastDay)
      entries.push(pastEntry)
    }
  }

  return entries
}
