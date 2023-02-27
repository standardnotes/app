import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'
import { UserRequestResponseBody } from './UserRequestResponseBody'

export interface UserRequestResponse extends HttpResponse {
  data: Either<UserRequestResponseBody, HttpErrorResponseBody>
}
