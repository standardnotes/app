import { addCalendarMonths, numberOfMonthsBetweenDates } from '@/Utils/DateUtils'
import { CalendarActivity } from './CalendarActivity'
import { CalendarMonth } from './CalendarMonth'

type DateOnlyString = string

export function dateToDateOnlyString(date: Date): DateOnlyString {
  return date.toLocaleDateString()
}

type ActivityRecord = Record<DateOnlyString, CalendarActivity[]>

export function createActivityRecord(activities: CalendarActivity[]): ActivityRecord {
  const map: Record<string, CalendarActivity[]> = {}
  for (const activity of activities) {
    const string = dateToDateOnlyString(activity.date)
    if (!map[string]) {
      map[string] = []
    }
    map[string].push(activity)
  }
  return map
}

export function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function getStartDayOfMonth(date: Date) {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  return startDate === 0 ? 7 : startDate
}

/**
 * Modifies months array in-place.
 */
export function insertMonths(months: CalendarMonth[], location: 'front' | 'end', number: number): CalendarMonth[] {
  const earlierMonth = months[0].date
  const laterMonth = months[months.length - 1].date

  for (let i = 1; i <= number; i++) {
    if (location === 'front') {
      const minusNFromFirstMonth = addCalendarMonths(earlierMonth, -i)
      months.unshift({
        date: minusNFromFirstMonth,
      })
    } else {
      const plusNFromLastMonth = addCalendarMonths(laterMonth, i)
      months.push({
        date: plusNFromLastMonth,
      })
    }
  }

  return months
}

/**
 * Modifies months array in-place.
 */
export function insertMonthsWithTarget(months: CalendarMonth[], targetMonth: Date): CalendarMonth[] {
  const firstMonth = months[0].date
  const lastMonth = months[months.length - 1].date

  const isBeforeFirstMonth = targetMonth.getTime() < firstMonth.getTime()

  const numMonthsToAdd = Math.abs(
    isBeforeFirstMonth
      ? numberOfMonthsBetweenDates(firstMonth, targetMonth)
      : numberOfMonthsBetweenDates(lastMonth, targetMonth),
  )

  if (isBeforeFirstMonth) {
    return insertMonths(months, 'front', numMonthsToAdd)
  } else {
    return insertMonths(months, 'end', numMonthsToAdd)
  }
}

/**
 * Modifies months array in-place.
 */
export function removeMonths(months: CalendarMonth[], location: 'front' | 'end', number: number): void {
  if (location === 'front') {
    months.splice(0, number)
  } else {
    months.splice(months.length - number - 1, number)
  }
}
