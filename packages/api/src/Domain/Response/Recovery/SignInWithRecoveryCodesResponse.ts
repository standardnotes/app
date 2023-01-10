import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'

import { SignInWithRecoveryCodesResponseBody } from './SignInWithRecoveryCodesResponseBody'

export interface SignInWithRecoveryCodesResponse extends HttpResponse {
  data: Either<SignInWithRecoveryCodesResponseBody, HttpErrorResponseBody>
}
