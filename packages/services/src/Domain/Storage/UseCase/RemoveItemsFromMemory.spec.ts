import { RemoveItemsFromMemory } from './RemoveItemsFromMemory'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { StorageServiceInterface } from '../StorageServiceInterface'
import { PayloadManagerInterface } from '../../Payloads/PayloadManagerInterface'
import { PayloadEmitSource, DecryptedItemInterface } from '@standardnotes/models'
import { Uuids } from '@standardnotes/utils'

describe('RemoveItemsFromMemory', () => {
  let storage: StorageServiceInterface
  let items: ItemManagerInterface
  let payloads: PayloadManagerInterface
  let removeItemsFromMemory: RemoveItemsFromMemory

  beforeEach(() => {
    storage = {
      getRawPayloads: jest.fn().mockImplementation(() => Promise.resolve([])),
    } as unknown as StorageServiceInterface

    items = {
      removeItemsFromMemory: jest.fn(),
    } as unknown as ItemManagerInterface

    payloads = {
      emitPayloads: jest.fn().mockImplementation(() => Promise.resolve()),
    } as unknown as PayloadManagerInterface

    removeItemsFromMemory = new RemoveItemsFromMemory(storage, items, payloads)
  })

  it('should execute removeItemsFromMemory use case correctly', async () => {
    const testItems: DecryptedItemInterface[] = [
      <DecryptedItemInterface>{
        uuid: 'uuid1',
        content_type: 'type1',
      },
      <DecryptedItemInterface>{
        uuid: 'uuid2',
        content_type: 'type2',
      },
    ]

    await removeItemsFromMemory.execute(testItems)

    expect(items.removeItemsFromMemory).toHaveBeenCalledWith(testItems)
    expect(storage.getRawPayloads).toHaveBeenCalledWith(Uuids(testItems))
    expect(payloads.emitPayloads).toHaveBeenCalledWith([], PayloadEmitSource.LocalDatabaseLoaded)
  })
})
