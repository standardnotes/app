import { TEnvironment } from '@Root/App'

export function isNullOrUndefined(value: unknown) {
  return value === null || value === undefined
}

/**
 * Returns a string with non-alphanumeric characters stripped out
 */
export function stripNonAlphanumeric(str: string) {
  return str.replace(/\W/g, '')
}

export function isMatchCaseInsensitive(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase()
}

/**
 * Returns a Date object from a JSON stringified date
 */
export function dateFromJsonString(str: string) {
  if (str) {
    return new Date(JSON.parse(str))
  }

  return str
}

/**
 * Returns a boolean representing whether two dates are on the same day
 */
export function isSameDay(dateA: Date, dateB: Date) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

export function isUnfinishedFeaturesEnabled(env: TEnvironment): boolean {
  return env === 'dev' || __DEV__
}
