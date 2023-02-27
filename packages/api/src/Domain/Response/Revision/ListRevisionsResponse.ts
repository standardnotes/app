import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'

import { ListRevisionsResponseBody } from './ListRevisionsResponseBody'

export interface ListRevisionsResponse extends HttpResponse {
  data: Either<ListRevisionsResponseBody, HttpErrorResponseBody>
}
