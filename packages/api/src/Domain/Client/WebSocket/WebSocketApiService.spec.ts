import { WebSocketConnectionTokenResponse } from '../../Response'

import { WebSocketServerInterface } from '../../Server/WebSocket/WebSocketServerInterface'
import { WebSocketApiOperations } from './WebSocketApiOperations'

import { WebSocketApiService } from './WebSocketApiService'

describe('WebSocketApiService', () => {
  let webSocketServer: WebSocketServerInterface

  const createService = () => new WebSocketApiService(webSocketServer)

  beforeEach(() => {
    webSocketServer = {} as jest.Mocked<WebSocketServerInterface>
    webSocketServer.createConnectionToken = jest.fn().mockReturnValue({
      data: { token: 'foobar' },
    } as jest.Mocked<WebSocketConnectionTokenResponse>)
  })

  it('should create a websocket connection token', async () => {
    const response = await createService().createConnectionToken()

    expect(response).toEqual({
      data: {
        token: 'foobar',
      },
    })
    expect(webSocketServer.createConnectionToken).toHaveBeenCalledWith({})
  })

  it('should not create a token if it is already creating', async () => {
    const service = createService()
    Object.defineProperty(service, 'operationsInProgress', {
      get: () => new Map([[WebSocketApiOperations.CreatingConnectionToken, true]]),
    })

    let error = null
    try {
      await service.createConnectionToken()
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should not create a token if the server fails', async () => {
    webSocketServer.createConnectionToken = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    let error = null
    try {
      await createService().createConnectionToken()
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })
})
