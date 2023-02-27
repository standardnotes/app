import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'

import { DeleteRevisionResponseBody } from './DeleteRevisionResponseBody'

export interface DeleteRevisionResponse extends HttpResponse {
  data: Either<DeleteRevisionResponseBody, HttpErrorResponseBody>
}
