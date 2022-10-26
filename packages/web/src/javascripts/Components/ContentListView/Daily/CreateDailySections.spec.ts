import { addDays } from '@/Utils/DateUtils'
import { ListableContentItem } from '../Types/ListableContentItem'
import { createDailySectionsWithTemplateInterstices } from './CreateDailySections'
import { dailiesDateToSectionTitle } from './Utils'

describe('create daily sections', () => {
  it('should add padding to front and end', () => {
    const today = new Date()
    const item = { created_at: today } as jest.Mocked<ListableContentItem>
    const result = createDailySectionsWithTemplateInterstices([item], 2)

    expect(result.length).toEqual(5)

    expect(result[0].dateKey).toEqual(dailiesDateToSectionTitle(addDays(today, 2)))
    expect(result[1].dateKey).toEqual(dailiesDateToSectionTitle(addDays(today, 1)))
    expect(result[2].dateKey).toEqual(dailiesDateToSectionTitle(addDays(today, 0)))
    expect(result[3].dateKey).toEqual(dailiesDateToSectionTitle(addDays(today, -1)))
    expect(result[4].dateKey).toEqual(dailiesDateToSectionTitle(addDays(today, -2)))
  })

  it('should handle 0 items with padding', () => {
    const result = createDailySectionsWithTemplateInterstices([], 1)

    expect(result.length).toEqual(3)

    const today = new Date()
    expect(result[0].dateKey).toEqual(dailiesDateToSectionTitle(addDays(today, 1)))
    expect(result[1].dateKey).toEqual(dailiesDateToSectionTitle(addDays(today, 0)))
    expect(result[2].dateKey).toEqual(dailiesDateToSectionTitle(addDays(today, -1)))
  })

  it('should add padding between items', () => {
    const today = new Date()
    const future = addDays(new Date(), 3)
    const todayItem = { created_at: today } as jest.Mocked<ListableContentItem>
    const futureItem = { created_at: future } as jest.Mocked<ListableContentItem>
    const result = createDailySectionsWithTemplateInterstices([todayItem, futureItem], 0)

    expect(result.length).toEqual(4)

    expect(result[0].dateKey).toEqual(dailiesDateToSectionTitle(future))
    expect(result[1].dateKey).toEqual(dailiesDateToSectionTitle(addDays(future, -1)))
    expect(result[2].dateKey).toEqual(dailiesDateToSectionTitle(addDays(future, -2)))
    expect(result[3].dateKey).toEqual(dailiesDateToSectionTitle(today))
  })

  it('should add padding to front, end, and between', () => {
    const today = new Date()
    const future = addDays(new Date(), 2)
    const todayItem = { created_at: today } as jest.Mocked<ListableContentItem>
    const futureItem = { created_at: future } as jest.Mocked<ListableContentItem>
    const result = createDailySectionsWithTemplateInterstices([todayItem, futureItem], 1)

    expect(result.length).toEqual(5)

    expect(result[0].dateKey).toEqual(dailiesDateToSectionTitle(addDays(future, 1)))
    expect(result[1].dateKey).toEqual(dailiesDateToSectionTitle(future))
    expect(result[2].dateKey).toEqual(dailiesDateToSectionTitle(addDays(future, -1)))
    expect(result[3].dateKey).toEqual(dailiesDateToSectionTitle(today))
    expect(result[4].dateKey).toEqual(dailiesDateToSectionTitle(addDays(today, -1)))
  })

  it('item entries should be sorted newest first', () => {
    const today = new Date()
    const tomorrow = addDays(new Date(), 1)
    const future = addDays(new Date(), 2)
    const todayItem = { created_at: today } as jest.Mocked<ListableContentItem>
    const tomorrowItem = { created_at: tomorrow } as jest.Mocked<ListableContentItem>
    const futureItem = { created_at: future } as jest.Mocked<ListableContentItem>
    const result = createDailySectionsWithTemplateInterstices([tomorrowItem, todayItem, futureItem], 0)

    expect(result.length).toEqual(3)

    expect(result[0].dateKey).toEqual(dailiesDateToSectionTitle(future))
    expect(result[1].dateKey).toEqual(dailiesDateToSectionTitle(tomorrow))
    expect(result[2].dateKey).toEqual(dailiesDateToSectionTitle(today))
  })

  it('insertBlanksBetweenItemEntries should not infinitely loop', () => {
    const today = new Date()
    expect(
      createDailySectionsWithTemplateInterstices([{ created_at: today } as jest.Mocked<ListableContentItem>], 0),
    ).toHaveLength(1)

    expect(
      createDailySectionsWithTemplateInterstices(
        [
          { created_at: today } as jest.Mocked<ListableContentItem>,
          { created_at: today } as jest.Mocked<ListableContentItem>,
        ],
        0,
      ),
    ).toHaveLength(1)

    expect(
      createDailySectionsWithTemplateInterstices(
        [
          { created_at: today } as jest.Mocked<ListableContentItem>,
          { created_at: addDays(today, 1) } as jest.Mocked<ListableContentItem>,
        ],
        0,
      ),
    ).toHaveLength(2)

    expect(
      createDailySectionsWithTemplateInterstices(
        [
          { created_at: today } as jest.Mocked<ListableContentItem>,
          { created_at: addDays(today, 5) } as jest.Mocked<ListableContentItem>,
        ],
        0,
      ),
    ).toHaveLength(6)

    expect(
      createDailySectionsWithTemplateInterstices(
        [
          { created_at: today } as jest.Mocked<ListableContentItem>,
          { created_at: addDays(today, 4) } as jest.Mocked<ListableContentItem>,
        ],
        0,
      ),
    ).toHaveLength(5)

    expect(
      createDailySectionsWithTemplateInterstices(
        [
          { created_at: addDays(today, 5) } as jest.Mocked<ListableContentItem>,
          { created_at: addDays(today, 4) } as jest.Mocked<ListableContentItem>,
          { created_at: today } as jest.Mocked<ListableContentItem>,
          { created_at: addDays(today, -7) } as jest.Mocked<ListableContentItem>,
        ],
        0,
      ),
    ).toHaveLength(13)

    expect(
      createDailySectionsWithTemplateInterstices(
        [
          { created_at: addDays(today, 5) } as jest.Mocked<ListableContentItem>,
          { created_at: addDays(today, 4) } as jest.Mocked<ListableContentItem>,
          { created_at: today } as jest.Mocked<ListableContentItem>,
          { created_at: addDays(today, -7) } as jest.Mocked<ListableContentItem>,
        ],
        1,
      ),
    ).toHaveLength(15)

    expect(
      createDailySectionsWithTemplateInterstices(
        [
          { created_at: addDays(today, -4) } as jest.Mocked<ListableContentItem>,
          { created_at: addDays(today, -4) } as jest.Mocked<ListableContentItem>,
          { created_at: addDays(today, -5) } as jest.Mocked<ListableContentItem>,
          { created_at: addDays(today, -7) } as jest.Mocked<ListableContentItem>,
          { created_at: addDays(today, -8) } as jest.Mocked<ListableContentItem>,
          { created_at: addDays(today, -9) } as jest.Mocked<ListableContentItem>,
          { created_at: addDays(today, -10) } as jest.Mocked<ListableContentItem>,
          { created_at: addDays(today, -11) } as jest.Mocked<ListableContentItem>,
          { created_at: addDays(today, -11) } as jest.Mocked<ListableContentItem>,
        ],
        8,
      ),
    ).toHaveLength(24)
  })
})
