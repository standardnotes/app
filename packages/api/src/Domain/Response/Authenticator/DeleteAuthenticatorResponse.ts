import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'

import { DeleteAuthenticatorResponseBody } from './DeleteAuthenticatorResponseBody'

export interface DeleteAuthenticatorResponse extends HttpResponse {
  data: Either<DeleteAuthenticatorResponseBody, HttpErrorResponseBody>
}
