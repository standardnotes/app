import { HttpServiceInterface } from '../../Http'
import { WebSocketConnectionTokenResponse } from '../../Response'

import { WebSocketServer } from './WebSocketServer'

describe('WebSocketServer', () => {
  let httpService: HttpServiceInterface

  const createServer = () => new WebSocketServer(httpService)

  beforeEach(() => {
    httpService = {} as jest.Mocked<HttpServiceInterface>
    httpService.post = jest.fn().mockReturnValue({
      data: { token: 'foobar' },
    } as jest.Mocked<WebSocketConnectionTokenResponse>)
  })

  it('should create a websocket connection token', async () => {
    const response = await createServer().createConnectionToken({})

    expect(response).toEqual({
      data: {
        token: 'foobar',
      },
    })
  })
})
