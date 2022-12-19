import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { SessionRefreshResponseBody } from './SessionRefreshResponseBody'

export interface SessionRefreshResponse extends HttpResponse {
  data: Either<SessionRefreshResponseBody, HttpErrorResponseBody>
}
