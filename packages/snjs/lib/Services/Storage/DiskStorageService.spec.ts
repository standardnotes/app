import { DiskStorageService } from './DiskStorageService'
import { InternalEventBus, DeviceInterface, InternalEventBusInterface } from '@standardnotes/services'

describe('diskStorageService', () => {
  let storageService: DiskStorageService
  let internalEventBus: InternalEventBusInterface
  let device: DeviceInterface

  beforeEach(() => {
    internalEventBus = {} as jest.Mocked<InternalEventBus>
    device = {} as jest.Mocked<DeviceInterface>

    storageService = new DiskStorageService(device, 'test', internalEventBus)
  })

  it('setInitialValues should set unwrapped values as wrapped value if wrapped value is not encrypted', async () => {
    storageService.isStorageWrapped = jest.fn().mockReturnValue(false)

    await storageService['setInitialValues']({
      wrapped: { content: { foo: 'bar' } } as never,
      nonwrapped: {},
      unwrapped: { bar: 'zoo' },
    })

    expect(storageService['values']).toEqual({
      wrapped: { content: { foo: 'bar' } } as never,
      nonwrapped: {},
      unwrapped: { bar: 'zoo', foo: 'bar' },
    })
  })
})
