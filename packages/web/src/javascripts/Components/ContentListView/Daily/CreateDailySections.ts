import { addDaysToDate } from '@standardnotes/utils'
import { ListableContentItem } from '../Types/ListableContentItem'
import { getWeekdayName } from '@/Utils/DateUtils'
import { DailyItemsDay } from './DailyItemsDaySection'
import { dateToDailyDayIdentifier } from './Utils'

export const createItemsByDateMapping = (items: ListableContentItem[]) => {
  const mapping: Record<string, ListableContentItem[]> = {}

  for (const item of items) {
    const key = dateToDailyDayIdentifier(item.created_at)
    if (!mapping[key]) {
      mapping[key] = []
    }
    mapping[key].push(item)
  }

  return mapping
}

export const templateEntryForDate = (date: Date): DailyItemsDay => {
  const entryDateString = dateToDailyDayIdentifier(date)

  return {
    dateKey: entryDateString,
    date: date,
    day: date.getDate(),
    isToday: entryDateString === dateToDailyDayIdentifier(new Date()),
    id: entryDateString,
    weekday: getWeekdayName(date, 'short'),
  }
}

export function createDailyItemsWithToday(count: number): DailyItemsDay[] {
  const items = [templateEntryForDate(new Date())]
  insertBlanks(items, 'front', count / 2 - 1)
  return insertBlanks(items, 'end', count / 2)
}

/**
 * Modifies entries array in-place.
 */
export function insertBlanks(entries: DailyItemsDay[], location: 'front' | 'end', number: number): DailyItemsDay[] {
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
      const plusNFromFirstDay = addDaysToDate(laterDay, i)
      const futureEntry = templateEntryForDate(plusNFromFirstDay)
      entries.unshift(futureEntry)
    } else {
      const minusNFromLastDay = addDaysToDate(earlierDay, -i)
      const pastEntry = templateEntryForDate(minusNFromLastDay)
      entries.push(pastEntry)
    }
  }

  return entries
}
