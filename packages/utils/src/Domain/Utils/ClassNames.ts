export const classNames = (...values: any[]): string => {
  return values.map((value) => (typeof value === 'string' ? value : null)).join(' ')
}
