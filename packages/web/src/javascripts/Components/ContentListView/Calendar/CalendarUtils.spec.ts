import { addMonths, areDatesInSameMonth } from '@/Utils/DateUtils'
import { CalendarMonth } from './CalendarMonth'
import { insertMonthsWithTarget } from './CalendarUtilts'

describe('calendar utils', () => {
  it('insertMonthsWithTarget in past', () => {
    const today = new Date()
    const months: CalendarMonth[] = [{ date: addMonths(today, -1) }, { date: today }, { date: addMonths(today, 1) }]
    const targetMonth = addMonths(today, -12)

    const result = insertMonthsWithTarget(months, targetMonth)

    expect(result).toHaveLength(14)
    expect(areDatesInSameMonth(result[0].date, targetMonth))
  })

  it('insertMonthsWithTarget in future', () => {
    const today = new Date()
    const months: CalendarMonth[] = [{ date: addMonths(today, -1) }, { date: today }, { date: addMonths(today, 1) }]
    const targetMonth = addMonths(today, 12)

    const result = insertMonthsWithTarget(months, targetMonth)

    expect(result).toHaveLength(14)
    expect(areDatesInSameMonth(result[result.length - 1].date, targetMonth))
  })
})
