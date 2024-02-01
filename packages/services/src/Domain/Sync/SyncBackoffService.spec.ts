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

    service.backoffItem(Uuid.create('00000000-0000-0000-0000-000000000000').getValue())

    expect(service.isItemInBackoff({ uuid: '00000000-0000-0000-0000-000000000000' } as jest.Mocked<AnyItemInterface>)).toBe(true)
  })

  it('should not be in backoff if backoff expired', () => {
    const service = createService()

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)

    service.backoffItem(Uuid.create('00000000-0000-0000-0000-000000000000').getValue())

    jest.spyOn(Date, 'now').mockReturnValueOnce(2_000_000)

    expect(service.isItemInBackoff({ uuid: '00000000-0000-0000-0000-000000000000' } as jest.Mocked<AnyItemInterface>)).toBe(false)
  })

  it('should double backoff penalty on each backoff', () => {
    const service = createService()

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)

    service.backoffItem(Uuid.create('00000000-0000-0000-0000-000000000000').getValue())

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)
    expect(service.isItemInBackoff({ uuid: '00000000-0000-0000-0000-000000000000' } as jest.Mocked<AnyItemInterface>)).toBe(true)

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)
    service.backoffItem(Uuid.create('00000000-0000-0000-0000-000000000000').getValue())

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_001_000)
    expect(service.isItemInBackoff({ uuid: '00000000-0000-0000-0000-000000000000' } as jest.Mocked<AnyItemInterface>)).toBe(true)

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)
    service.backoffItem(Uuid.create('00000000-0000-0000-0000-000000000000').getValue())

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_003_000)
    expect(service.isItemInBackoff({ uuid: '00000000-0000-0000-0000-000000000000' } as jest.Mocked<AnyItemInterface>)).toBe(true)
  })

  it('should remove backoff penalty on successful sync', async () => {
    const service = createService()

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)

    service.backoffItem(Uuid.create('00000000-0000-0000-0000-000000000000').getValue())

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

  it('should get a smaller subset of item uuids in backoff that have lesser penalty', () => {
    const service = createService()

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)

    for (let i = 0; i < 5; i++) {
      service.backoffItem(Uuid.create('00000000-0000-0000-0000-000000000000').getValue())
    }
    for (let i = 0; i < 4; i++) {
      service.backoffItem(Uuid.create('00000000-0000-0000-0000-000000000001').getValue())
    }
    for (let i = 0; i < 3; i++) {
      service.backoffItem(Uuid.create('00000000-0000-0000-0000-000000000002').getValue())
    }
    for (let i = 0; i < 2; i++) {
      service.backoffItem(Uuid.create('00000000-0000-0000-0000-000000000003').getValue())
    }
    service.backoffItem(Uuid.create('00000000-0000-0000-0000-000000000004').getValue())

    const subset = service.getSmallerSubsetOfItemUuidsInBackoff()

    expect(subset.length).toEqual(3)

    expect(subset[0].value).toBe('00000000-0000-0000-0000-000000000004')
    expect(subset[1].value).toBe('00000000-0000-0000-0000-000000000003')
    expect(subset[2].value).toBe('00000000-0000-0000-0000-000000000002')
  })
})
