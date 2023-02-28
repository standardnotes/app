import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import { WebSocketConnectionTokenRequestParams } from '../../Request/WebSocket/WebSocketConnectionTokenRequestParams'
import { HttpResponse } from '@standardnotes/responses'
import { WebSocketConnectionTokenResponseBody } from '../../Response/WebSocket/WebSocketConnectionTokenResponseBody'
import { Paths } from './Paths'
import { WebSocketServerInterface } from './WebSocketServerInterface'

export class WebSocketServer implements WebSocketServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async createConnectionToken(
    params: WebSocketConnectionTokenRequestParams,
  ): Promise<HttpResponse<WebSocketConnectionTokenResponseBody>> {
    return this.httpService.post(Paths.v1.createConnectionToken, params)
  }
}
