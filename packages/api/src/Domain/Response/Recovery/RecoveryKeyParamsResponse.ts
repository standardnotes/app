import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'

import { RecoveryKeyParamsResponseBody } from './RecoveryKeyParamsResponseBody'

export interface RecoveryKeyParamsResponse extends HttpResponse {
  data: Either<RecoveryKeyParamsResponseBody, HttpErrorResponseBody>
}
