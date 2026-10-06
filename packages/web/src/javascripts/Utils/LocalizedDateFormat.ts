import { dateToLocalizedString } from '@standardnotes/snjs'
import { getIntlLocale } from '@/Utils/DateLocale'
import { c } from 'ttag'

export function capitalizeForSentenceStart(text: string): string {
  if (!text) {
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

export function formatDateAndTimeForNote(date: Date, includeTime = true): string {
  const options: Intl.DateTimeFormatOptions = includeTime
    ? { ...noteDateOptions, hour: 'numeric', minute: '2-digit' }
    : noteDateOptions

  return formatDateTime(date, options)
}

export function formatDateForContextMenu(date: Date | undefined): string | undefined {
  if (!date) {
    return undefined
  }

  const datePart = formatDateTime(date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const timePart = dateToHoursAndMinutesTimeString(date)

  return `${datePart} ${timePart}`
}

export function formatDefaultDateTime(date: Date): string {
  return formatDateTime(date, { dateStyle: 'medium', timeStyle: 'short' })
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
  const datePart = formatDateTime(date)
  const timePart = dateToHoursAndMinutesTimeString(date)

  return c('B2.NavSharedUI.Label').t`${datePart} at ${timePart}`
}

export function dateToHoursAndMinutesTimeString(date: Date): string {
  return formatDateTime(date, { timeStyle: 'short' })
}
