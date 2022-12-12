import { addDaysToDate } from '@standardnotes/utils'
import { ListableContentItem } from '../Types/ListableContentItem'
import { DailyItemsDay } from './DailyItemsDaySection'

export function dateToDailyDayIdentifier(date: Date): string {
  return date.toLocaleDateString()
}

export function getDailyWritingStreak(
  todayItem: DailyItemsDay | undefined,
  itemsByDateMapping: Record<string, ListableContentItem[]>,
) {
  if (!todayItem) {
    return 0
  }

  const startDay = todayItem.date
  let checkingDayOffsetFromToday = -1
  let keepLooping = true
  let streak = 0

  while (keepLooping) {
    const checkingDay = addDaysToDate(startDay, checkingDayOffsetFromToday)
    const items = itemsByDateMapping[dateToDailyDayIdentifier(checkingDay)]
    if (!items || items?.length === 0) {
      keepLooping = false
      break
    }

    streak++
    checkingDayOffsetFromToday--
  }

  const hasEntryForToday = itemsByDateMapping[dateToDailyDayIdentifier(todayItem.date)]?.length > 0

  return streak + (hasEntryForToday ? 1 : 0)
}
