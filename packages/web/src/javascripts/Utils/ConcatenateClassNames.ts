export const classNames = (...values: (string | boolean | undefined)[]): string => {
  return values.map((value) => (typeof value === 'string' ? value : null)).join(' ')
}
