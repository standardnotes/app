import VersionInfo from 'react-native-version-info'

export const IsDev = VersionInfo.bundleIdentifier?.includes('dev')

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

function parseFileName(fileName: string): {
  name: string
  ext: string
} {
  const pattern = /(?:\.([^.]+))$/
  const extMatches = pattern.exec(fileName)
  const ext = extMatches?.[1] || ''
  const name = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName

  return { name, ext }
}

function sanitizeFileName(name: string): string {
  return name.trim().replace(/[.\\/:"?*|<>]/g, '_')
}

export function sanitizeFileNameForNativeWrite(filename: string): string {
  const { name, ext } = parseFileName(filename)
  return `${sanitizeFileName(name)}.${ext}`
}
