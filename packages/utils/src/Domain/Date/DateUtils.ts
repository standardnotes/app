/** Negative numbers are supported as well */
export function addDaysToDate(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)

  return result
}

export function addHoursToDate(date: Date, hours: number) {
  const result = new Date(date)
  result.setHours(result.getHours() + hours)

  return result
}
