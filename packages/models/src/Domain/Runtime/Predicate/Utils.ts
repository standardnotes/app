/**
 * Predicate date strings are of form "x.days.ago" or "x.hours.ago"
 */
export function dateFromDSLDateString(string: string): Date {
  const comps = string.split('.')
  const unit = comps[1]
  const date = new Date()
  const offset = parseInt(comps[0])
  if (unit === 'days') {
    date.setDate(date.getDate() - offset)
  } else if (unit === 'hours') {
    date.setHours(date.getHours() - offset)
  } else if (unit === 'months') {
    date.setMonth(date.getMonth() - offset)
  } else if (unit === 'years') {
    date.setFullYear(date.getFullYear() - offset)
  }
  return date
}
