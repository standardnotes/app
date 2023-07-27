import { isNotUndefined } from './Utils'

export const classNames = (...values: (string | null | undefined | boolean)[]): string => {
  return values
    .map((value) => (typeof value === 'string' ? value : null))
    .filter(isNotUndefined)
    .join(' ')
}
