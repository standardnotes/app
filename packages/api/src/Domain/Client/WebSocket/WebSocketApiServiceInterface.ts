import { WebSocketConnectionTokenResponse } from '../../Response'

export interface WebSocketApiServiceInterface {
  createConnectionToken(): Promise<WebSocketConnectionTokenResponse>
}
