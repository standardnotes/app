import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'

import { GenerateRecoveryCodesResponseBody } from './GenerateRecoveryCodesResponseBody'

export interface GenerateRecoveryCodesResponse extends HttpResponse {
  data: Either<GenerateRecoveryCodesResponseBody, HttpErrorResponseBody>
}
