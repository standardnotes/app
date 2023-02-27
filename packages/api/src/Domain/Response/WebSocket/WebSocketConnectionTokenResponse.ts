import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'
import { WebSocketConnectionTokenResponseBody } from './WebSocketConnectionTokenResponseBody'

export interface WebSocketConnectionTokenResponse extends HttpResponse {
  data: Either<WebSocketConnectionTokenResponseBody, HttpErrorResponseBody>
}
