import { isString } from '@standardnotes/utils'
import { CollectionSort, CollectionSortDirection, CollectionSortProperty } from '../Collection/CollectionSort'
import { DisplayItem } from './Types'

export const SortLeftFirst = -1
export const SortRightFirst = 1
export const KeepSameOrder = 0

/** @O(n * log(n)) */
export function sortTwoItems(
  a: DisplayItem | undefined,
  b: DisplayItem | undefined,
  sortBy: CollectionSortProperty,
  sortDirection: CollectionSortDirection,
  bypassPinCheck = false,
): number {
  /** If the elements are undefined, move to beginning */
  if (!a) {
    return SortLeftFirst
  }

  if (!b) {
    return SortRightFirst
  }

  if (!bypassPinCheck) {
    if (a.pinned && b.pinned) {
      return sortTwoItems(a, b, sortBy, sortDirection, true)
    }
    if (a.pinned) {
      return SortLeftFirst
    }
    if (b.pinned) {
      return SortRightFirst
    }
  }

  const aValue = a[sortBy] || ''
  const bValue = b[sortBy] || ''
  const smallerNaturallyComesFirst = sortDirection === 'asc'

  let compareResult = KeepSameOrder

  /**
   * Check for string length due to issue on React Native 0.65.1
   * where empty strings causes crash:
   * https://github.com/facebook/react-native/issues/32174
   * */
  if (
    sortBy === CollectionSort.Title &&
    isString(aValue) &&
    isString(bValue) &&
    aValue.length > 0 &&
    bValue.length > 0
  ) {
    compareResult = aValue.localeCompare(bValue, 'en', { numeric: true })
  } else if (aValue > bValue) {
    compareResult = SortRightFirst
  } else if (aValue < bValue) {
    compareResult = SortLeftFirst
  } else {
    compareResult = KeepSameOrder
  }

  const isLeftSmaller = compareResult === SortLeftFirst
  const isLeftBigger = compareResult === SortRightFirst

  if (isLeftSmaller) {
    if (smallerNaturallyComesFirst) {
      return SortLeftFirst
    } else {
      return SortRightFirst
    }
  } else if (isLeftBigger) {
    if (smallerNaturallyComesFirst) {
      return SortRightFirst
    } else {
      return SortLeftFirst
    }
  } else {
    return KeepSameOrder
  }
}
