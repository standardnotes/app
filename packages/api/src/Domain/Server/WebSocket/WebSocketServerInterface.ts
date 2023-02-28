import { HttpResponse } from '@standardnotes/responses'
import { WebSocketConnectionTokenRequestParams } from '../../Request/WebSocket/WebSocketConnectionTokenRequestParams'
import { WebSocketConnectionTokenResponseBody } from '../../Response/WebSocket/WebSocketConnectionTokenResponseBody'

export interface WebSocketServerInterface {
  createConnectionToken(
    params: WebSocketConnectionTokenRequestParams,
  ): Promise<HttpResponse<WebSocketConnectionTokenResponseBody>>
}
