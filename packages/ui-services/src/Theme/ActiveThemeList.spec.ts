import { ActiveThemeList } from './ActiveThemeList'
import { ItemManagerInterface } from '@standardnotes/services'
import { Uuid } from '@standardnotes/domain-core'

describe('ActiveThemeList', () => {
  let itemManager: ItemManagerInterface
  let list: ActiveThemeList

  beforeEach(() => {
    itemManager = {} as ItemManagerInterface
    itemManager.findItem = jest.fn()

    list = new ActiveThemeList(itemManager)
  })

  it('should initialize with an empty list', () => {
    expect(list.getList()).toEqual([])
  })

  it('should be empty initially', () => {
    expect(list.isEmpty()).toBe(true)
  })

  it('should not have items that have not been added', () => {
    const uuid = Uuid.create('00000000-0000-0000-0000-000000000000').getValue()
    expect(list.has(uuid)).toBe(false)
  })

  it('should add an item to the list', () => {
    const uuid = Uuid.create('00000000-0000-0000-0000-000000000000').getValue()
    list.add(uuid)
    expect(list.getList()).toContain(uuid)
    expect(list.has(uuid)).toBe(true)
  })

  it('should not add a duplicate item to the list', () => {
    const uuid = Uuid.create('00000000-0000-0000-0000-000000000000').getValue()
    list.add(uuid)
    list.add(uuid)
    expect(list.getList()).toEqual([uuid])
  })

  it('should remove an item from the list', () => {
    const uuid = Uuid.create('00000000-0000-0000-0000-000000000000').getValue()
    list.add(uuid)
    list.remove(uuid)
    expect(list.getList()).not.toContain(uuid)
    expect(list.has(uuid)).toBe(false)
  })

  it('should clear the list', () => {
    const uuid = Uuid.create('00000000-0000-0000-0000-000000000000').getValue()
    list.add(uuid)
    list.clear()
    expect(list.getList()).toEqual([])
    expect(list.has(uuid)).toBe(false)
  })
})
