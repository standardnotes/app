import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'

import { DeleteRevisionResponseBody } from './DeleteRevisionResponseBody'

export interface DeleteRevisionResponse extends HttpResponse {
  data: Either<DeleteRevisionResponseBody, HttpErrorResponseBody>
}
