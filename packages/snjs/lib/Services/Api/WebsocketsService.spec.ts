import { InternalEventBusInterface } from '@standardnotes/services'
import { WebSocketApiServiceInterface } from '@standardnotes/api'

import { StorageKey, DiskStorageService } from '@Lib/index'
import { SNWebSocketsService } from './WebsocketsService'

describe('webSocketsService', () => {
  const webSocketUrl = ''

  let storageService: DiskStorageService
  let webSocketApiService: WebSocketApiServiceInterface
  let internalEventBus: InternalEventBusInterface

  const createService = () => {
    return new SNWebSocketsService(storageService, webSocketUrl, webSocketApiService, internalEventBus)
  }

  beforeEach(() => {
    storageService = {} as jest.Mocked<DiskStorageService>
    storageService.setValue = jest.fn()

    internalEventBus = {} as jest.Mocked<InternalEventBusInterface>
    internalEventBus.publish = jest.fn()

    webSocketApiService = {} as jest.Mocked<WebSocketApiServiceInterface>
    webSocketApiService.createConnectionToken = jest.fn().mockReturnValue({ token: 'foobar' })
  })

  describe('setWebSocketUrl()', () => {
    it('saves url in local storage', async () => {
      const webSocketUrl = 'wss://test-websocket'
      await createService().setWebSocketUrl(webSocketUrl)
      expect(storageService.setValue).toHaveBeenCalledWith(StorageKey.WebSocketUrl, webSocketUrl)
    })
  })
})
