/* eslint-disable @typescript-eslint/no-explicit-any */
import { sanitize } from 'dompurify'
import { find, isArray, mergeWith, remove, uniq, uniqWith } from 'lodash'
import { AnyRecord } from '@standardnotes/common'

const collator = typeof Intl !== 'undefined' ? new Intl.Collator('en', { numeric: true }) : undefined

export function getGlobalScope(): Window | unknown | null {
  return typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : null
}

export function dictToArray<T>(dict: Record<any, T>): T[] {
  return Object.values(dict)
}

/**
 * Whether we are in a web browser
 */
export function isWebEnvironment(): boolean {
  return getGlobalScope() !== null
}

interface IEDocument {
  documentMode?: number
}

/**
 * @returns true if WebCrypto is available
 */
export function isWebCryptoAvailable(): boolean {
  return (
    (isWebEnvironment() && !isReactNativeEnvironment() && !(document && (document as IEDocument).documentMode)) ||
    (/Edge/.test(navigator.userAgent) && window.crypto && !!window.crypto.subtle)
  )
}

/**
 * Whether we are in React Native app
 */
export function isReactNativeEnvironment(): boolean {
  return typeof navigator !== 'undefined' && navigator.product === 'ReactNative'
}

/**
 * Searches array of objects for first object where object[key] === value
 * @returns Matching object or null if not found
 */
export function findInArray<T, K extends keyof T>(array: T[], key: K, value: T[K]): T | undefined {
  return array.find((item: T) => item[key] === value)
}

/**
 * Searches array of objects for first object where object[key] === value
 * @returns Matching object or null if not found
 */
export function searchArray<T>(array: T[], predicate: Partial<T>): T | undefined {
  return find(array, predicate) as T
}

export function sureSearchArray<T>(array: T[], predicate: Partial<T>): T {
  return searchArray(array, predicate) as T
}

/**
 * @returns Whether the value is a function or object
 */
export function isObject(value: unknown): value is object {
  if (value === null) {
    return false
  }
  return typeof value === 'function' || typeof value === 'object'
}

/**
 * @returns Whether the value is a function
 */
export function isFunction(value: unknown): boolean {
  if (value === null) {
    return false
  }
  return typeof value === 'function'
}

/**
 * @returns True if the object is null or undefined, otherwise false
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

export function isNotUndefined<T>(val: T | undefined | null): val is T {
  return val != undefined
}

/**
 * @returns True if the string is empty or undefined
 */
export function isEmpty(string: string): boolean {
  return !string || string.length === 0
}

/**
 * @returns Whether the value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string' || value instanceof String
}

/**
 * @returns The greater of the two dates
 */
export function greaterOfTwoDates(dateA: Date, dateB: Date): Date {
  if (dateA > dateB) {
    return dateA
  } else {
    return dateB
  }
}

/**
 * Returns a new array containing only unique values by combining the two input arrays.
 * Elements are unique based on the values of `equalityKeys`.
 * @param equalityKeys - Keys to determine element equality
 * @returns Array containing unique values
 */
export function uniqCombineObjArrays<T>(arrayA: T[], arrayB: T[], equalityKeys: (keyof T)[]): T[] {
  return uniqWith(arrayA.concat(arrayB), (a: T, b: T) => {
    for (const key of equalityKeys) {
      if (a[key] !== b[key]) {
        return false
      }
    }
    return true
  })
}

/**
 * Returns a new array containing only unique values
 * @returns Array containing unique values
 */
export function uniqueArray<T>(array: T[]): T[] {
  return uniq(array)
}

/**
 * Returns a new array containing only unique values
 * @returns Array containing unique values
 */
export function uniqueArrayByKey<T>(array: T[], key: keyof T): T[] {
  return uniqWith(array, (a: T, b: T) => {
    return a[key] === b[key]
  })
}

/**
 * Returns the last element in the array.
 * @returns The last element in the array
 */
export function lastElement<T>(array: T[]): T | undefined {
  return array[array.length - 1]
}

/**
 * Adds all items from otherArray into inArray, in-place.
 * Does not return a value.
 */
export function extendArray<T, K extends T>(inArray: T[], otherArray: K[]): void {
  for (const value of otherArray) {
    inArray.push(value)
  }
}

/**
 * Removes all items appearing in toSubtract from inArray, in-place
 * @param toSubtract - The list of items to remove from inArray
 */
export function subtractFromArray<T>(inArray: T[], toSubtract: T[]): void {
  for (const value of toSubtract) {
    removeFromArray(inArray, value)
  }
}

/**
 * Removes the first matching element of an array by strict equality.
 * If no matchin element is found, the array is left unchanged.
 */
export function removeFromArray<T>(array: T[], value: T): void {
  const valueIndex = array.indexOf(value)
  if (valueIndex === -1) {
    return
  }
  array.splice(valueIndex, 1)
}

/**
 * Adds the element to the array if the array does not already include the value.
 * The array is searched via array.indexOf
 * @returns true if value was added
 */
export function addIfUnique<T>(array: T[], value: T): boolean {
  if (!array.includes(value)) {
    array.push(value)
    return true
  }
  return false
}

/**
 * Removes an object from the array in-place by searching for an object where all the
 * key/values in predicate match with the candidate element.
 */
export function filterFromArray<T>(
  array: T[],
  predicate: Partial<Record<keyof T, any>> | ((object: T) => boolean),
): void {
  remove(array, predicate)
}

/**
 * Returns a new array by removing all elements in subtract from array
 */
export function arrayByDifference<T>(array: T[], subtract: T[]): T[] {
  return array.filter((x) => !subtract.includes(x)).concat(subtract.filter((x) => !array.includes(x)))
}

export function compareArrayReferences<T>(arr1: T[], arr2: T[]) {
  return arr1.length === arr2.length && arr1.every((val, index) => val === arr2[index])
}

export function compareValues<T>(left: T, right: T) {
  if ((left && !right) || (!left && right)) {
    return false
  }
  if (left instanceof Date && right instanceof Date) {
    return left.getTime() === right.getTime()
  } else if (left instanceof String && right instanceof String) {
    return left === right
  } else {
    return topLevelCompare(left, right)
  }
}

/**
 * Removes the value from the array at the given index, in-place.
 */
export function removeFromIndex(array: any[], index: number) {
  array.splice(index, 1)
}

/**
 * Adds the value from the array at the given index, in-place.
 */
export function addAtIndex<T>(array: T[], element: T, index: number) {
  array.splice(index, 0, element)
}

/**
 * Returns a new array by removeing the value from the array at the given index
 */
export function arrayByRemovingFromIndex<T>(array: T[], index: number) {
  const copy = array.slice()
  removeFromIndex(copy, index)
  return copy
}

/**
 * Returns an array where each element is the value of a top-level
 * object key.
 * Example: objectToValueArray({a: 1, b: 2}) returns [1, 2]
 */
export function objectToValueArray(object: AnyRecord) {
  const values = []
  for (const key of Object.keys(object)) {
    values.push(object[key])
  }
  return values
}

/**
 * Returns a key-sorted copy of the object.
 * For example, sortedCopy({b: '1', a: '2'}) returns {a: '2', b: '1'}
 */
export function sortedCopy<T>(object: any): T {
  const keys = Object.keys(object).sort()
  const result: any = {}
  for (const key of keys) {
    result[key] = object[key]
  }
  return Copy(result)
}

export const sortByKey = <T>(input: T[], key: keyof T): T[] => {
  const compare = (a: T, b: T): number => {
    const valueA = a[key]
    const valueB = b[key]

    if (valueA < valueB) {
      return -1
    }
    if (valueA > valueB) {
      return 1
    }
    return 0
  }

  const newArray = [...input]
  newArray.sort(compare)

  return newArray
}

/** Returns a new object by omitting any keys which have an undefined or null value  */
export function omitUndefinedCopy(object: any) {
  const result: any = {}
  for (const key of Object.keys(object)) {
    if (!isNullOrUndefined(object[key])) {
      result[key] = object[key]
    }
  }
  return result
}

/**
 * Returns a new array by sorting an array of elements based on a date property,
 * as indicated by the input key value.
 */
export function dateSorted<T>(elements: T[], key: keyof T, ascending = true) {
  return elements.sort((a, b) => {
    const aTimestamp = (a[key] as unknown as Date).getTime()
    const bTimestamp = (b[key] as unknown as Date).getTime()
    const vector = ascending ? 1 : -1
    if (aTimestamp < bTimestamp) {
      return -1 * vector
    } else if (aTimestamp > bTimestamp) {
      return 1 * vector
    } else {
      return 0
    }
  })
}

/** Compares for equality by comparing top-level keys value equality (===) */
export function topLevelCompare<T>(left: T, right: T) {
  if (!left && !right) {
    return true
  }
  if (!left || !right) {
    return false
  }
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  if (leftKeys.length !== rightKeys.length) {
    return false
  }
  for (const key of leftKeys) {
    if ((left as any)[key] !== (right as any)[key]) {
      return false
    }
  }
  return true
}

/**
 * Returns a new object by attempting to JSON.parse any top-level object keys.
 */
export function jsonParseEmbeddedKeys(object: AnyRecord) {
  const result: AnyRecord = {}
  for (const key of Object.keys(object)) {
    let value
    try {
      value = JSON.parse(object[key] as string)
    } catch (error) {
      value = object[key]
    }
    result[key] = value
  }
  return result
}

export const withoutLastElement = <T>(array: T[]): T[] => {
  return array.slice(0, -1)
}

/**
 * Deletes keys of the input object.
 */
export function omitInPlace<T>(object: T, keys: Array<keyof T>) {
  if (!object) {
    return
  }
  for (const key of keys) {
    delete object[key]
  }
}

/**
 * Creates a new object by omitting `keys` from `object`
 */
export function omitByCopy<T>(object: T, keys: Array<keyof T>) {
  if (isNullOrUndefined(object)) {
    return undefined
  }
  const newObject = Object.assign({}, object)
  /**
   * Lodash's omit, which was previously used, seems to cause unexpected behavior
   * when payload is an ES6 item class. So we instead manually omit each key.
   */
  for (const key of keys) {
    delete newObject[key]
  }
  return newObject
}

/**
 * Similiar to Node's path.join, this function combines an array of paths into
 * one resolved path.
 */
export function joinPaths(...args: string[]) {
  return args
    .map((part, i) => {
      if (i === 0) {
        return part.trim().replace(/[/]*$/g, '')
      } else {
        return part.trim().replace(/(^[/]*|[/]*$)/g, '')
      }
    })
    .filter((x) => x.length)
    .join('/')
}

/**
 * Creates a copy of the input object by JSON stringifying the object then JSON parsing
 * the string (if the input is an object). If input is date, a Date copy will be created,
 * and if input is a primitive value, it will be returned as-is.
 */
export function Copy<T>(object: any): T {
  if (object instanceof Date) {
    return new Date(object) as T
  } else if (isObject(object)) {
    return JSON.parse(JSON.stringify(object))
  } else {
    return object
  }
}

/**
 * Merges the second object parameter into the first object, in-place.
 * @returns The now modified first object parameter passed into the function.
 */
export function deepMerge(a: AnyRecord, b: AnyRecord) {
  /**
   * lodash.merge will not merge a full array with an empty one.
   * deepMerge will replace arrays wholesale
   */
  if (!a || !b) {
    throw 'Attempting to deepMerge with null values'
  }
  const customizer = (aValue: any, bValue: any) => {
    if (isArray(aValue)) {
      return bValue
    }
  }
  mergeWith(a, b, customizer)
  return a
}

/**
 * Returns a new object by selecting certain keys from input object.
 */
export function pickByCopy<T>(object: T, keys: Array<keyof T>): T {
  const result = {} as T
  for (const key of keys) {
    result[key] = object[key]
  }
  return Copy(result)
}

/**
 * Recursively makes an object immutable via Object.freeze
 */
export function deepFreeze(object: any) {
  const propNames = Object.getOwnPropertyNames(object)
  for (const name of propNames) {
    const value = object[name]
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      object[name] = deepFreeze(value)
    } else {
      object[name] = value
    }
  }

  return Object.freeze(object)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Determines if an object has a getter defined for a given property
 */
export function hasGetter(object: any, property: string) {
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(object), property)
  return descriptor && !isNullOrUndefined(descriptor.get)
}

/**
 * Truncates a hex string into a desired number of bits
 * @returns A hexadecimal string truncated to the number of desired bits
 */
export function truncateHexString(string: string, desiredBits: number) {
  const BITS_PER_HEX_CHAR = 4
  const desiredCharLength = desiredBits / BITS_PER_HEX_CHAR
  return string.substring(0, desiredCharLength)
}

/**
 * When awaited, this function allows code execution to pause for a set time.
 * Should be used primarily for testing.
 */
export async function sleep(milliseconds: number, warn = true, desc = ''): Promise<void> {
  if (warn) {
    console.warn(`Sleeping for ${milliseconds}ms ${desc}`)
  }
  return new Promise<void>((resolve) => {
    setTimeout(function () {
      resolve()
    }, milliseconds)
  })
}

export function assertUnreachable(uncheckedCase: never): never {
  throw Error('Unchecked case ' + uncheckedCase)
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

/**
 * Sorts an array of objects in natural order
 * @param items - The array of objects to sort
 * @param property - The objects' property to sort by
 * @param direction - The sorting direction, either ascending (default) or descending
 * @returns Array of objects sorted in natural order
 */
export function naturalSort<T extends AnyRecord>(
  items: T[],
  property: keyof T,
  direction: 'asc' | 'desc' = 'asc',
): T[] {
  switch (direction) {
    case 'asc':
      return [...items].sort(
        collator
          ? (a, b) => collator.compare(a[property] as string, b[property] as string)
          : (a, b) => (a[property] as string).localeCompare(b[property] as string, 'en', { numeric: true }),
      )
    case 'desc':
      return [...items].sort(
        collator
          ? (a, b) => collator.compare(b[property] as string, a[property] as string)
          : (a, b) => (b[property] as string).localeCompare(a[property] as string, 'en', { numeric: true }),
      )
  }
}

export function arraysEqual<T>(left: T[], right: T[]): boolean {
  if (left.length !== right.length) {
    return false
  }
  return left.every((item) => right.includes(item)) && right.every((item) => left.includes(item))
}

const MicrosecondsInAMillisecond = 1_000
const MillisecondsInASecond = 1_000

enum TimestampDigits {
  Seconds = 10,
  Milliseconds = 13,
  Microseconds = 16,
}

export function convertTimestampToMilliseconds(timestamp: number): number {
  const digits = String(timestamp).length
  switch (digits) {
    case TimestampDigits.Seconds:
      return timestamp * MillisecondsInASecond
    case TimestampDigits.Milliseconds:
      return timestamp
    case TimestampDigits.Microseconds:
      return Math.floor(timestamp / MicrosecondsInAMillisecond)

    default:
      throw `Unhandled timestamp precision: ${timestamp}`
  }
}

export function sanitizeHtmlString(html: string): string {
  return sanitize(html)
}

let sharedDateFormatter: unknown
export function dateToLocalizedString(date: Date): string {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat && typeof navigator !== 'undefined') {
    if (!sharedDateFormatter) {
      const locale = navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language
      sharedDateFormatter = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    return (sharedDateFormatter as Intl.DateTimeFormat).format(date)
  } else {
    // IE < 11, Safari <= 9.0.
    // In English, this generates the string most similar to
    // the toLocaleDateString() result above.
    return date.toDateString() + ' ' + date.toLocaleTimeString()
  }
}

export function nonSecureRandomIdentifier(): string {
  return `${Math.random() * 100}`.replace('.', '')
}

export function splitString(string: string, parts: number): string[] {
  const outputLength = string.length
  const partLength = outputLength / parts
  const partitions = []
  for (let i = 0; i < parts; i++) {
    const partition = string.slice(partLength * i, partLength * (i + 1))
    partitions.push(partition)
  }
  return partitions
}

export function firstHalfOfString(string: string): string {
  return string.substring(0, string.length / 2)
}

export function secondHalfOfString(string: string): string {
  return string.substring(string.length / 2, string.length)
}

export function log(namespace: string, ...args: any[]): void {
  logWithColor(namespace, 'black', ...args)
}

export function logWithColor(namespace: string, namespaceColor: string, ...args: any[]): void {
  const date = new Date()
  const timeString = `${date.toLocaleTimeString().replace(' PM', '').replace(' AM', '')}.${date.getMilliseconds()}`
  customLog(
    `%c${namespace}%c${timeString}`,
    `color: ${namespaceColor}; font-weight: bold; margin-right: 4px`,
    'color: gray',
    ...args,
  )
}

function customLog(..._args: any[]) {
  // eslint-disable-next-line no-console, prefer-rest-params
  Function.prototype.apply.call(console.log, console, arguments)
}

export function assert(value: unknown): asserts value {
  if (value === undefined) {
    throw new Error('Assertion failed; value must be defined')
  }
}

export function useBoolean(value: boolean | undefined, defaultValue: boolean): boolean {
  return value != undefined ? value : defaultValue
}

export function spaceSeparatedStrings(...strings: string[]): string {
  return strings.join(' ')
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}
