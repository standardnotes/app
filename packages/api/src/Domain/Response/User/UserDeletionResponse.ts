import { Either } from '@standardnotes/common'
import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'

import { UserDeletionResponseBody } from './UserDeletionResponseBody'

export interface UserDeletionResponse extends HttpResponse {
  data: Either<UserDeletionResponseBody, HttpErrorResponseBody>
}
