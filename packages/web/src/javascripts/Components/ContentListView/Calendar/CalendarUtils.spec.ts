import { addCalendarMonths, areDatesInSameMonth } from '@/Utils/DateUtils'
import { CalendarMonth } from './CalendarMonth'
import { insertMonthsWithTarget } from './CalendarUtilts'

describe('calendar utils', () => {
  it('handles flakey date', () => {
    const date = new Date('Mon Oct 31 2022 08:10:18 GMT-0500')
    const result = addCalendarMonths(date, -1)

    expect(areDatesInSameMonth(date, result)).toEqual(false)
  })

  it('addMonths', () => {
    const today = new Date()
    const result = addCalendarMonths(today, -1)

    expect(areDatesInSameMonth(today, result)).toEqual(false)
  })

  it('insertMonthsWithTarget in past', () => {
    const today = new Date()
    const months: CalendarMonth[] = [
      { date: addCalendarMonths(today, -1) },
      { date: today },
      { date: addCalendarMonths(today, 1) },
    ]
    const targetMonth = addCalendarMonths(today, -12)

    const result = insertMonthsWithTarget(months, targetMonth)

    expect(result).toHaveLength(14)
    expect(areDatesInSameMonth(result[0].date, targetMonth))
  })

  it('insertMonthsWithTarget in future', () => {
    const today = new Date()
    const months: CalendarMonth[] = [
      { date: addCalendarMonths(today, -1) },
      { date: today },
      { date: addCalendarMonths(today, 1) },
    ]
    const targetMonth = addCalendarMonths(today, 12)

    const result = insertMonthsWithTarget(months, targetMonth)

    expect(result).toHaveLength(14)
    expect(areDatesInSameMonth(result[result.length - 1].date, targetMonth))
  })
})
