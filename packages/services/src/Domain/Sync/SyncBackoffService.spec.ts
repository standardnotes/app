import { AnyItemInterface } from '@standardnotes/models'
import { SyncBackoffService } from './SyncBackoffService'

describe('SyncBackoffService', () => {
  const createService = () => new SyncBackoffService()

  it('should not be in backoff if no backoff was set', () => {
    const service = createService()

    expect(service.isItemInBackoff({ uuid: '123' } as jest.Mocked<AnyItemInterface>)).toBe(false)
  })

  it('should be in backoff if backoff was set', () => {
    const service = createService()

    service.backoffItem({ uuid: '123' } as jest.Mocked<AnyItemInterface>)

    expect(service.isItemInBackoff({ uuid: '123' } as jest.Mocked<AnyItemInterface>)).toBe(true)
  })

  it('should not be in backoff if backoff expired', () => {
    const service = createService()

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)

    service.backoffItem({ uuid: '123' } as jest.Mocked<AnyItemInterface>)

    jest.spyOn(Date, 'now').mockReturnValueOnce(2_000_000)

    expect(service.isItemInBackoff({ uuid: '123' } as jest.Mocked<AnyItemInterface>)).toBe(false)
  })

  it('should double backoff penalty on each backoff', () => {
    const service = createService()

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)

    service.backoffItem({ uuid: '123' } as jest.Mocked<AnyItemInterface>)

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)
    expect(service.isItemInBackoff({ uuid: '123' } as jest.Mocked<AnyItemInterface>)).toBe(true)

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)
    service.backoffItem({ uuid: '123' } as jest.Mocked<AnyItemInterface>)

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_001_000)
    expect(service.isItemInBackoff({ uuid: '123' } as jest.Mocked<AnyItemInterface>)).toBe(true)

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_000_000)
    service.backoffItem({ uuid: '123' } as jest.Mocked<AnyItemInterface>)

    jest.spyOn(Date, 'now').mockReturnValueOnce(1_003_000)
    expect(service.isItemInBackoff({ uuid: '123' } as jest.Mocked<AnyItemInterface>)).toBe(true)
  })
})
