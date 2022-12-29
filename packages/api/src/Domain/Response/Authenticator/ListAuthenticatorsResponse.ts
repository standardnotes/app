import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'

import { ListAuthenticatorsResponseBody } from './ListAuthenticatorsResponseBody'

export interface ListAuthenticatorsResponse extends HttpResponse {
  data: Either<ListAuthenticatorsResponseBody, HttpErrorResponseBody>
}
