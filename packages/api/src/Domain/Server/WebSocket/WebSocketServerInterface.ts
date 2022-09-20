import { WebSocketConnectionTokenRequestParams } from '../../Request/WebSocket/WebSocketConnectionTokenRequestParams'
import { WebSocketConnectionTokenResponse } from '../../Response/WebSocket/WebSocketConnectionTokenResponse'

export interface WebSocketServerInterface {
  createConnectionToken(params: WebSocketConnectionTokenRequestParams): Promise<WebSocketConnectionTokenResponse>
}
