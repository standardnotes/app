import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'

import { ListRevisionsResponseBody } from './ListRevisionsResponseBody'

export interface ListRevisionsResponse extends HttpResponse {
  data: Either<ListRevisionsResponseBody, HttpErrorResponseBody>
}
