import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'

import { VerifyAuthenticatorRegistrationResponseResponseBody } from './VerifyAuthenticatorRegistrationResponseResponseBody'

export interface VerifyAuthenticatorRegistrationResponseResponse extends HttpResponse {
  data: Either<VerifyAuthenticatorRegistrationResponseResponseBody, HttpErrorResponseBody>
}
