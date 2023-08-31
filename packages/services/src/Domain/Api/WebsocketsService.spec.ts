import { WebSocketApiServiceInterface } from '@standardnotes/api'

import { WebSocketsService } from './WebsocketsService'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { StorageKey } from '../Storage/StorageKeys'

describe('webSocketsService', () => {
  const webSocketUrl = ''

  let storageService: StorageServiceInterface
  let webSocketApiService: WebSocketApiServiceInterface
  let internalEventBus: InternalEventBusInterface

  const createService = () => {
    return new WebSocketsService(storageService, webSocketUrl, webSocketApiService, internalEventBus)
  }

  beforeEach(() => {
    storageService = {} as jest.Mocked<StorageServiceInterface>
    storageService.setValue = jest.fn()

    internalEventBus = {} as jest.Mocked<InternalEventBusInterface>
    internalEventBus.publish = jest.fn()

    webSocketApiService = {} as jest.Mocked<WebSocketApiServiceInterface>
    webSocketApiService.createConnectionToken = jest.fn().mockReturnValue({ token: 'foobar' })
  })

  describe('setWebSocketUrl()', () => {
    it('saves url in local storage', () => {
      const webSocketUrl = 'wss://test-websocket'
      createService().setWebSocketUrl(webSocketUrl)
      expect(storageService.setValue).toHaveBeenCalledWith(StorageKey.WebSocketUrl, webSocketUrl)
    })
  })
})
