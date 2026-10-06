import { dateToLocalizedString } from '@standardnotes/snjs'
import { getIntlLocale, isDateLocalizationEnabled } from '@/Utils/DateLocale'

export function capitalizeForSentenceStart(text: string): string {
  if (!text || !isDateLocalizationEnabled()) {
    return text
  }

  const locale = getIntlLocale()
  const firstCharacter = text[0]

  if (firstCharacter.toLocaleUpperCase(locale) === firstCharacter) {
    return text
  }

  if (firstCharacter.toLocaleLowerCase(locale) === firstCharacter) {
    return firstCharacter.toLocaleUpperCase(locale) + text.slice(1)
  }

  return text
}

export function formatDateTime(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(getIntlLocale(), options).format(date)
}

export function formatItemDate(date: Date): string {
  return dateToLocalizedString(date)
}

export function formatItemDateForSentenceStart(date: Date): string {
  return capitalizeForSentenceStart(formatItemDate(date))
}

export function formatDateAndTimeForNoteTitle(date: Date, includeTime = true): string {
  return capitalizeForSentenceStart(formatDateAndTimeForNote(date, includeTime))
}

const noteDateOptions: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}

function formatDateAtTime(date: Date, dateOptions: Intl.DateTimeFormatOptions): string {
  if (isDateLocalizationEnabled()) {
    return formatDateTime(date, { ...dateOptions, hour: 'numeric', minute: '2-digit' })
  }

  return `${formatDateTime(date, dateOptions)} at ${dateToHoursAndMinutesTimeString(date)}`
}

export function formatDateAndTimeForNote(date: Date, includeTime = true): string {
  return includeTime ? formatDateAtTime(date, noteDateOptions) : formatDateTime(date, noteDateOptions)
}

export function formatDateForContextMenu(date: Date | undefined): string | undefined {
  if (!date) {
    return undefined
  }

  if (!isDateLocalizationEnabled()) {
    return `${date.toDateString()} ${date.toLocaleTimeString()}`
  }

  const datePart = formatDateTime(date, { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })

  return `${datePart} ${date.toLocaleTimeString(getIntlLocale())}`
}

export function formatDefaultDateTime(date: Date): string {
  return date.toLocaleString(getIntlLocale())
}

export function formatSessionAccessDate(date: Date): string {
  return formatDateTime(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
  })
}

export function formatMonthAndYear(date: Date): string {
  return formatDateTime(date, {
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateOnlyString(date: Date): string {
  return formatDateTime(date)
}

export function dateToStringStyle1(date: Date): string {
  return formatDateAtTime(date, { year: 'numeric', month: 'numeric', day: 'numeric' })
}

export function dateToHoursAndMinutesTimeString(date: Date): string {
  return formatDateTime(date, { timeStyle: 'short' })
}
