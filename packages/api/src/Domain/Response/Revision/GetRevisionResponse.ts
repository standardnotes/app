import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'

import { GetRevisionResponseBody } from './GetRevisionResponseBody'

export interface GetRevisionResponse extends HttpResponse {
  data: Either<GetRevisionResponseBody, HttpErrorResponseBody>
}
