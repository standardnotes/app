import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'

import { ListAuthenticatorsResponseBody } from './ListAuthenticatorsResponseBody'

export interface ListAuthenticatorsResponse extends HttpResponse {
  data: Either<ListAuthenticatorsResponseBody, HttpErrorResponseBody>
}
