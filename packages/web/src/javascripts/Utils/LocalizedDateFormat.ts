import { getIntlLocale } from '@/Utils/DateLocale'

export function getFormattingLocale(): string {
  return getIntlLocale()
}

export function formatDateTime(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(getFormattingLocale(), options).format(date)
}

const lastSyncDateFormatOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
}

export function formatLastSyncDate(date: Date): string {
  return formatDateTime(date, lastSyncDateFormatOptions)
}

export function formatDateAndTimeForNote(date: Date, includeTime = true): string {
  const locale = getFormattingLocale()

  if (includeTime) {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateForContextMenu(date: Date | undefined): string | undefined {
  if (!date) {
    return undefined
  }

  const locale = getFormattingLocale()
  const datePart = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
  const timePart = new Intl.DateTimeFormat(locale, {
    timeStyle: 'short',
  }).format(date)

  return `${datePart} ${timePart}`
}

export function dateToStringStyle1(date: Date): string {
  const locale = getFormattingLocale()
  const datePart = new Intl.DateTimeFormat(locale).format(date)
  const timePart = new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(date)

  return `${datePart} at ${timePart}`
}

export function dateToHoursAndMinutesTimeString(date: Date): string {
  return new Intl.DateTimeFormat(getFormattingLocale(), {
    timeStyle: 'short',
  }).format(date)
}
