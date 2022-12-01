import { addDaysToDate } from '@standardnotes/utils'
import { numDaysBetweenDates } from './DateUtils'

describe('date utils', () => {
  describe('numDaysBetweenDates', () => {
    it('should return full days diff accurately', () => {
      const today = new Date()

      expect(numDaysBetweenDates(today, addDaysToDate(today, 1))).toEqual(1)
      expect(numDaysBetweenDates(today, addDaysToDate(today, 2))).toEqual(2)
      expect(numDaysBetweenDates(today, addDaysToDate(today, 3))).toEqual(3)
    })

    it('should return absolute value of difference', () => {
      const today = new Date()

      expect(numDaysBetweenDates(today, addDaysToDate(today, 3))).toEqual(3)
      expect(numDaysBetweenDates(addDaysToDate(today, 3), today)).toEqual(3)
    })

    it('should return 1 day difference between two dates on different days but 1 hour apart', () => {
      const today = new Date()
      const oneHourBeforeMidnight = new Date()
      oneHourBeforeMidnight.setHours(0, 0, 0, 0)
      oneHourBeforeMidnight.setHours(-1, 0, 0, 0)

      expect(today.toDateString()).not.toEqual(oneHourBeforeMidnight.toDateString())
      expect(numDaysBetweenDates(today, oneHourBeforeMidnight)).toEqual(1)
    })
  })
})
