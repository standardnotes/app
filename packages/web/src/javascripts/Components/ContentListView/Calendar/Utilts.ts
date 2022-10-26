import { CalendarActivity } from './CalendarActivity'

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
