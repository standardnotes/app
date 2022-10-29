import { createDailyItemsWithToday } from './CreateDailySections'

describe('create daily sections', () => {
  it('createDailyItemsWithToday', () => {
    const result = createDailyItemsWithToday(10)

    expect(result).toHaveLength(10)
  })
})
