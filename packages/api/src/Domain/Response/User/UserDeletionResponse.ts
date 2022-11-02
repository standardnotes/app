import { Either } from '@standardnotes/common'
import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'

import { UserDeletionResponseBody } from './UserDeletionResponseBody'

export interface UserDeletionResponse extends HttpResponse {
  data: Either<UserDeletionResponseBody, HttpErrorResponseBody>
}
