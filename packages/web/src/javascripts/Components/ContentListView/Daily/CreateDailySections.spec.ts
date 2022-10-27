import { addDays } from '@/Utils/DateUtils'
import { ListableContentItem } from '../Types/ListableContentItem'
import { createDailySectionsWithTemplateInterstices, insertBlanks } from './CreateDailySections'
import { dateToDailyDayIdentifier } from './Utils'

describe('create daily sections', () => {
  describe('createDailySectionsWithTemplateInterstices', () => {
    it('should handle 0 items', () => {
      const result = createDailySectionsWithTemplateInterstices([])

      expect(result.length).toEqual(0)
    })

    it('should add padding between items', () => {
      const today = new Date()
      const future = addDays(new Date(), 3)
      const todayItem = { created_at: today } as jest.Mocked<ListableContentItem>
      const futureItem = { created_at: future } as jest.Mocked<ListableContentItem>
      const result = createDailySectionsWithTemplateInterstices([todayItem, futureItem])

      expect(result.length).toEqual(4)

      expect(result[0].dateKey).toEqual(dateToDailyDayIdentifier(future))
      expect(result[1].dateKey).toEqual(dateToDailyDayIdentifier(addDays(future, -1)))
      expect(result[2].dateKey).toEqual(dateToDailyDayIdentifier(addDays(future, -2)))
      expect(result[3].dateKey).toEqual(dateToDailyDayIdentifier(today))
    })

    it('item entries should be sorted newest first', () => {
      const today = new Date()
      const tomorrow = addDays(new Date(), 1)
      const future = addDays(new Date(), 2)
      const todayItem = { created_at: today } as jest.Mocked<ListableContentItem>
      const tomorrowItem = { created_at: tomorrow } as jest.Mocked<ListableContentItem>
      const futureItem = { created_at: future } as jest.Mocked<ListableContentItem>
      const result = createDailySectionsWithTemplateInterstices([tomorrowItem, todayItem, futureItem])

      expect(result.length).toEqual(3)

      expect(result[0].dateKey).toEqual(dateToDailyDayIdentifier(future))
      expect(result[1].dateKey).toEqual(dateToDailyDayIdentifier(tomorrow))
      expect(result[2].dateKey).toEqual(dateToDailyDayIdentifier(today))
    })
  })

  describe('insertBlanks', () => {
    it('should add blanks to front', () => {
      const today = new Date()
      const item = { created_at: today } as jest.Mocked<ListableContentItem>
      const sections = createDailySectionsWithTemplateInterstices([item])
      const result = insertBlanks(sections, 'front', 2)

      expect(result.length).toEqual(3)

      expect(result[0].dateKey).toEqual(dateToDailyDayIdentifier(addDays(today, 2)))
      expect(result[1].dateKey).toEqual(dateToDailyDayIdentifier(addDays(today, 1)))
      expect(result[2].dateKey).toEqual(dateToDailyDayIdentifier(addDays(today, 0)))
    })
  })
})
