import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'

import { SignInWithRecoveryCodesResponseBody } from './SignInWithRecoveryCodesResponseBody'

export interface SignInWithRecoveryCodesResponse extends HttpResponse {
  data: Either<SignInWithRecoveryCodesResponseBody, HttpErrorResponseBody>
}
