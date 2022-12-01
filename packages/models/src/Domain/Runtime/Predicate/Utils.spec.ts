import { dateFromDSLDateString } from './Utils'
import { addDaysToDate, addHoursToDate } from '@standardnotes/utils'

describe('Predicate Utils', () => {
  describe('dateFromDSLDateString', () => {
    it('should return a date object with the correct day', () => {
      const date = dateFromDSLDateString('1.days.ago')
      expect(date.getDate()).toEqual(addDaysToDate(new Date(), -1).getDate())
    })

    it('should return a date object with the correct hour', () => {
      const date = dateFromDSLDateString('1.hours.ago')
      expect(date.getHours()).toEqual(addHoursToDate(new Date(), -1).getHours())
    })

    it('should return a date object with the correct month', () => {
      const date = dateFromDSLDateString('1.months.ago')
      expect(date.getMonth()).toEqual(new Date().getMonth() - 1)
    })

    it('should return a date object with the correct year', () => {
      const date = dateFromDSLDateString('1.years.ago')
      expect(date.getFullYear()).toEqual(new Date().getFullYear() - 1)
    })
  })
})
