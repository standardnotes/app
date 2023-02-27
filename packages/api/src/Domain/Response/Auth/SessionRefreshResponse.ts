import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'
import { SessionRefreshResponseBody } from './SessionRefreshResponseBody'

export interface SessionRefreshResponse extends HttpResponse {
  data: Either<SessionRefreshResponseBody, HttpErrorResponseBody>
}
