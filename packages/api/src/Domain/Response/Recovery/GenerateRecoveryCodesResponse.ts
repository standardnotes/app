import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'

import { GenerateRecoveryCodesResponseBody } from './GenerateRecoveryCodesResponseBody'

export interface GenerateRecoveryCodesResponse extends HttpResponse {
  data: Either<GenerateRecoveryCodesResponseBody, HttpErrorResponseBody>
}
