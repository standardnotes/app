import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'

import { RecoveryKeyParamsResponseBody } from './RecoveryKeyParamsResponseBody'

export interface RecoveryKeyParamsResponse extends HttpResponse {
  data: Either<RecoveryKeyParamsResponseBody, HttpErrorResponseBody>
}
