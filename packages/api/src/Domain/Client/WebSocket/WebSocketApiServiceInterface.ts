import { HttpResponse } from '@standardnotes/responses'
import { WebSocketConnectionTokenResponseBody } from '../../Response'

export interface WebSocketApiServiceInterface {
  createConnectionToken(): Promise<HttpResponse<WebSocketConnectionTokenResponseBody>>
}
