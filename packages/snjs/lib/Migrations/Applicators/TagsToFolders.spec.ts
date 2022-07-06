import { ItemManager } from '@Lib/Services'
import { TagsToFoldersMigrationApplicator } from './TagsToFolders'

const itemManagerMock = (tagTitles: string[]) => {
  const mockTag = (title: string) => ({
    title,
    uuid: title,
    parentId: undefined,
  })

  const mock = {
    getItems: jest.fn().mockReturnValue(tagTitles.map(mockTag)),
    findOrCreateTagParentChain: jest.fn(),
    changeItem: jest.fn(),
  }

  return mock
}

describe('folders component to hierarchy', () => {
  it('should produce a valid hierarchy in the simple case', async () => {
    const titles = ['a', 'a.b', 'a.b.c']

    const itemManager = itemManagerMock(titles)
    await TagsToFoldersMigrationApplicator.run(itemManager as unknown as ItemManager)

    const findOrCreateTagParentChainCalls = itemManager.findOrCreateTagParentChain.mock.calls
    const changeItemCalls = itemManager.changeItem.mock.calls

    expect(findOrCreateTagParentChainCalls.length).toEqual(2)
    expect(findOrCreateTagParentChainCalls[0][0]).toEqual(['a'])
    expect(findOrCreateTagParentChainCalls[1][0]).toEqual(['a', 'b'])

    expect(changeItemCalls.length).toEqual(2)
    expect(changeItemCalls[0][0].uuid).toEqual('a.b')
    expect(changeItemCalls[1][0].uuid).toEqual('a.b.c')
  })

  it('should not touch flat hierarchies', async () => {
    const titles = ['a', 'x', 'y', 'z']

    const itemManager = itemManagerMock(titles)
    await TagsToFoldersMigrationApplicator.run(itemManager as unknown as ItemManager)

    const findOrCreateTagParentChainCalls = itemManager.findOrCreateTagParentChain.mock.calls
    const changeItemCalls = itemManager.changeItem.mock.calls

    expect(findOrCreateTagParentChainCalls.length).toEqual(0)

    expect(changeItemCalls.length).toEqual(0)
  })

  it('should work despite cloned tags', async () => {
    const titles = ['a.b', 'c', 'a.b']

    const itemManager = itemManagerMock(titles)
    await TagsToFoldersMigrationApplicator.run(itemManager as unknown as ItemManager)

    const findOrCreateTagParentChainCalls = itemManager.findOrCreateTagParentChain.mock.calls
    const changeItemCalls = itemManager.changeItem.mock.calls

    expect(findOrCreateTagParentChainCalls.length).toEqual(2)
    expect(findOrCreateTagParentChainCalls[0][0]).toEqual(['a'])
    expect(findOrCreateTagParentChainCalls[1][0]).toEqual(['a'])

    expect(changeItemCalls.length).toEqual(2)
    expect(changeItemCalls[0][0].uuid).toEqual('a.b')
    expect(changeItemCalls[0][0].uuid).toEqual('a.b')
  })

  it('should produce a valid hierarchy cases with  missing intermediate tags or unordered', async () => {
    const titles = ['y.2', 'w.3', 'y']

    const itemManager = itemManagerMock(titles)
    await TagsToFoldersMigrationApplicator.run(itemManager as unknown as ItemManager)

    const findOrCreateTagParentChainCalls = itemManager.findOrCreateTagParentChain.mock.calls
    const changeItemCalls = itemManager.changeItem.mock.calls

    expect(findOrCreateTagParentChainCalls.length).toEqual(2)
    expect(findOrCreateTagParentChainCalls[0][0]).toEqual(['w'])
    expect(findOrCreateTagParentChainCalls[1][0]).toEqual(['y'])

    expect(changeItemCalls.length).toEqual(2)
    expect(changeItemCalls[0][0].uuid).toEqual('w.3')
    expect(changeItemCalls[1][0].uuid).toEqual('y.2')
  })

  it('skip prefixed names', async () => {
    const titles = ['.something', '.something...something']

    const itemManager = itemManagerMock(titles)
    await TagsToFoldersMigrationApplicator.run(itemManager as unknown as ItemManager)

    const findOrCreateTagParentChainCalls = itemManager.findOrCreateTagParentChain.mock.calls
    const changeItemCalls = itemManager.changeItem.mock.calls

    expect(findOrCreateTagParentChainCalls.length).toEqual(0)
    expect(changeItemCalls.length).toEqual(0)
  })

  it('skip not-supported names', async () => {
    const titles = [
      'something.',
      'something..',
      'something..another.thing',
      'a.b.c',
      'a',
      'something..another.thing..anyway',
    ]

    const itemManager = itemManagerMock(titles)
    await TagsToFoldersMigrationApplicator.run(itemManager as unknown as ItemManager)

    const findOrCreateTagParentChainCalls = itemManager.findOrCreateTagParentChain.mock.calls
    const changeItemCalls = itemManager.changeItem.mock.calls

    expect(findOrCreateTagParentChainCalls.length).toEqual(1)
    expect(findOrCreateTagParentChainCalls[0][0]).toEqual(['a', 'b'])

    expect(changeItemCalls.length).toEqual(1)
    expect(changeItemCalls[0][0].uuid).toEqual('a.b.c')
  })
})
