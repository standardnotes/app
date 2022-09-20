import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import { WebSocketConnectionTokenRequestParams } from '../../Request/WebSocket/WebSocketConnectionTokenRequestParams'
import { WebSocketConnectionTokenResponse } from '../../Response/WebSocket/WebSocketConnectionTokenResponse'
import { Paths } from './Paths'
import { WebSocketServerInterface } from './WebSocketServerInterface'

export class WebSocketServer implements WebSocketServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async createConnectionToken(
    params: WebSocketConnectionTokenRequestParams,
  ): Promise<WebSocketConnectionTokenResponse> {
    const response = await this.httpService.post(Paths.v1.createConnectionToken, params)

    return response as WebSocketConnectionTokenResponse
  }
}
