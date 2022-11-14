import { dateFromDSLDateString } from './Utils'

describe('Predicate Utils', () => {
  describe('dateFromDSLDateString', () => {
    it('should return a date object with the correct day', () => {
      const date = dateFromDSLDateString('1.days.ago')
      expect(date.getDate()).toEqual(new Date().getDate() - 1)
    })

    it('should return a date object with the correct hour', () => {
      const date = dateFromDSLDateString('1.hours.ago')
      expect(date.getHours()).toEqual(new Date().getHours() - 1)
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
