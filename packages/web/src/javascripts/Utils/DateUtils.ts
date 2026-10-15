import { getIntlLocale } from '@/Utils/DateLocale'

export function numHoursBetweenDates(date1: Date, date2: Date): number {
  return Math.abs(date1.getTime() - date2.getTime()) / 3600000
}

export function areDatesInSameDay(date1: Date, date2: Date): boolean {
  const locale = getIntlLocale()
  return date1.toLocaleDateString(locale) === date2.toLocaleDateString(locale)
}

export function numDaysBetweenDates(date1: Date, date2: Date): number {
  if (numHoursBetweenDates(date1, date2) < 24) {
    const locale = getIntlLocale()
    const dayOfWeekDiffers = date1.toLocaleDateString(locale) !== date2.toLocaleDateString(locale)
    if (dayOfWeekDiffers) {
      return 1
    }
  }
  const diffInMs = date1.getTime() - date2.getTime()
  const diffInDays = Math.abs(diffInMs / (1000 * 60 * 60 * 24))
  return Math.floor(diffInDays)
}

/**
 * @returns Date with day equal to first day of the offseted month
 */
export function addCalendarMonths(date: Date, months: number) {
  const result = new Date(date)
  const day = 1
  result.setMonth(result.getMonth() + months, day)
  return result
}

export function getWeekdayName(date: Date, format: 'long' | 'short'): string {
  return date.toLocaleString(getIntlLocale(), { weekday: format })
}

export function areDatesInSameMonth(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth()
}

export function numberOfMonthsBetweenDates(date1: Date, date2: Date, roundUpFractionalMonths = true) {
  let startDate = date1
  let endDate = date2
  let inverse = false

  if (date1 > date2) {
    startDate = date2
    endDate = date1
    inverse = true
  }

  const yearsDifference = endDate.getFullYear() - startDate.getFullYear()
  const monthsDifference = endDate.getMonth() - startDate.getMonth()
  const daysDifference = endDate.getDate() - startDate.getDate()

  let monthCorrection = 0
  if (roundUpFractionalMonths === true && daysDifference > 0) {
    monthCorrection = 1
  } else if (roundUpFractionalMonths !== true && daysDifference < 0) {
    monthCorrection = -1
  }

  return (inverse ? -1 : 1) * (yearsDifference * 12 + monthsDifference + monthCorrection)
}
