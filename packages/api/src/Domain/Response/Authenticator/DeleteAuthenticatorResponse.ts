import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'

import { DeleteAuthenticatorResponseBody } from './DeleteAuthenticatorResponseBody'

export interface DeleteAuthenticatorResponse extends HttpResponse {
  data: Either<DeleteAuthenticatorResponseBody, HttpErrorResponseBody>
}
