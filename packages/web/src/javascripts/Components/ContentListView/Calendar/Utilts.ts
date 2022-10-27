import { addMonths } from '@/Utils/DateUtils'
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
      const minusNFromFirstMonth = addMonths(earlierMonth, -i)
      months.unshift({
        date: minusNFromFirstMonth,
      })
    } else {
      const plusNFromLastMonth = addMonths(laterMonth, i)
      months.push({
        date: plusNFromLastMonth,
      })
    }
  }

  return months
}
