import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'

import { GetRevisionResponseBody } from './GetRevisionResponseBody'

export interface GetRevisionResponse extends HttpResponse {
  data: Either<GetRevisionResponseBody, HttpErrorResponseBody>
}
