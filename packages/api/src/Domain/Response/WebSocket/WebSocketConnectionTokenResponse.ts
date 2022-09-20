import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { WebSocketConnectionTokenResponseBody } from './WebSocketConnectionTokenResponseBody'

export interface WebSocketConnectionTokenResponse extends HttpResponse {
  data: Either<WebSocketConnectionTokenResponseBody, HttpErrorResponseBody>
}
