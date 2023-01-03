export function addHoursToDate(date: Date, hours: number) {
  const result = new Date(date)
  result.setHours(result.getHours() + hours)

  return result
}

/** Negative numbers are supported as well */
export function addDaysToDate(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)

  return result
}

export function addMonthsToDate(date: Date, months: number) {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)

  return result
}

export function addYearsToDate(date: Date, years: number) {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)

  return result
}
