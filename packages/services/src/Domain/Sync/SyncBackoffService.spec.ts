import { AnyItemInterface } from '@standardnotes/models'
import { SyncBackoffService } from './SyncBackoffService'
import { InternalEventBusInterface } from '../..'
import { Uuid } from '@standardnotes/domain-core'

describe('SyncBackoffService', () => {
  let internalEventBus: InternalEventBusInterface

  const createService = () => new SyncBackoffService(internalEventBus)

  beforeEach(() => {
    internalEventBus = {} as jest.Mocked<InternalEventBusInterface>
  })

  it('should not be in backoff if no backoff was set', () => {
    const service = createService()

    expect(service.isItemInBackoff({ uuid: '00000000-0000-0000-0000-000000000000' } as jest.Mocked<AnyItemInterface>)).toBe(false)
  })

  it('should be in backoff if backoff was set', () => {
    const service = createService()

    service.backoffItems([Uuid.create('00000000-0000-0000-0000-000000000000').getValue()])

    expect(service.isItemInBackoff({ uuid: '00000000-0000-0000-0000-000000000000' } as jest.Mocked<AnyItemInterface>)).toBe(true)
  })

  it('should not be in backoff if backoff expired', () => {
    const service = createService()

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)

    service.backoffItems([Uuid.create('00000000-0000-0000-0000-000000000000').getValue()])

    jest.spyOn(Date, 'now').mockReturnValueOnce(2_000_000)

    expect(service.isItemInBackoff({ uuid: '00000000-0000-0000-0000-000000000000' } as jest.Mocked<AnyItemInterface>)).toBe(false)
  })

  it('should double backoff penalty on each backoff', () => {
    const service = createService()

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)

    service.backoffItems([Uuid.create('00000000-0000-0000-0000-000000000000').getValue()])

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)
    expect(service.isItemInBackoff({ uuid: '00000000-0000-0000-0000-000000000000' } as jest.Mocked<AnyItemInterface>)).toBe(true)

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)
    service.backoffItems([Uuid.create('00000000-0000-0000-0000-000000000000').getValue()])

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_001_000)
    expect(service.isItemInBackoff({ uuid: '00000000-0000-0000-0000-000000000000' } as jest.Mocked<AnyItemInterface>)).toBe(true)

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)
    service.backoffItems([Uuid.create('00000000-0000-0000-0000-000000000000').getValue()])

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_003_000)
    expect(service.isItemInBackoff({ uuid: '00000000-0000-0000-0000-000000000000' } as jest.Mocked<AnyItemInterface>)).toBe(true)
  })

  it('should remove backoff penalty on successful sync', async () => {
    const service = createService()

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)

    service.backoffItems([Uuid.create('00000000-0000-0000-0000-000000000000').getValue()])

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)
    expect(service.isItemInBackoff({ uuid: '00000000-0000-0000-0000-000000000000' } as jest.Mocked<AnyItemInterface>)).toBe(true)

    await service.handleEvent({
      type: 'CompletedIncrementalSync',
      payload: {
        uploadedPayloads: [
          {
            uuid: '00000000-0000-0000-0000-000000000000',
          },
        ],
      },
    })

    expect(service.isItemInBackoff({ uuid: '00000000-0000-0000-0000-000000000000' } as jest.Mocked<AnyItemInterface>)).toBe(false)
  })

  it('should get a smaller and smaller subset of item uuids to back off until single uuids are ruled out', () => {
    const service = createService()

    jest.spyOn(Date, 'now').mockReturnValue(1_000_000)

    service.backoffItems([
      Uuid.create('00000000-0000-0000-0000-000000000000').getValue(),
      Uuid.create('00000000-0000-0000-0000-000000000001').getValue(),
      Uuid.create('00000000-0000-0000-0000-000000000002').getValue(),
      Uuid.create('00000000-0000-0000-0000-000000000003').getValue(),
      Uuid.create('00000000-0000-0000-0000-000000000004').getValue(),
    ])

    const expectedSubsetLenghts = [3, 3, 3, 3, 2, 1, 1, 1, 1, 1, 0]
    for (let i = 0; i < expectedSubsetLenghts.length; i++) {
      const subset = service.getSmallerSubsetOfItemUuidsInBackoff()
      service.backoffItems(subset)

      expect(subset.length).toBe(expectedSubsetLenghts[i])
    }
  })
})
