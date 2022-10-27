import { dateToLocalizedString } from '@standardnotes/snjs/'

export const formatLastSyncDate = (lastUpdatedDate: Date) => {
  return dateToLocalizedString(lastUpdatedDate)
}

export const formatDateForContextMenu = (date: Date | undefined) => {
  if (!date) {
    return
  }

  return `${date.toDateString()} ${date.toLocaleTimeString()}`
}

export const formatDateAndTimeForNote = (date: Date, includeTime = true) => {
  const dateString = `${date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`

  if (includeTime) {
    return `${dateString} at ${date.toLocaleTimeString(undefined, {
      timeStyle: 'short',
    })}`
  } else {
    return dateString
  }
}

export function numHoursBetweenDates(date1: Date, date2: Date): number {
  return Math.abs(date1.getTime() - date2.getTime()) / 3600000
}

export function numDaysBetweenDates(date1: Date, date2: Date): number {
  if (numHoursBetweenDates(date1, date2) < 24) {
    const dayOfWeekDiffers = date1.toLocaleDateString() !== date2.toLocaleDateString()
    if (dayOfWeekDiffers) {
      return 1
    }
  }
  const diffInMs = date1.getTime() - date2.getTime()
  const diffInDays = Math.abs(diffInMs / (1000 * 60 * 60 * 24))
  return Math.floor(diffInDays)
}

export function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function addMonths(date: Date, months: number) {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function getWeekdayName(date: Date, format: 'long' | 'short'): string {
  return date.toLocaleString('default', { weekday: format })
}

export function areDatesInSameMonth(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth()
}
