import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { UserRequestResponseBody } from './UserRequestResponseBody'

export interface UserRequestResponse extends HttpResponse {
  data: Either<UserRequestResponseBody, HttpErrorResponseBody>
}
