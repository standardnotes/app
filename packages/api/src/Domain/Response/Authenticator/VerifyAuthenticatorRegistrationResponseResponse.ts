import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'

import { VerifyAuthenticatorRegistrationResponseResponseBody } from './VerifyAuthenticatorRegistrationResponseResponseBody'

export interface VerifyAuthenticatorRegistrationResponseResponse extends HttpResponse {
  data: Either<VerifyAuthenticatorRegistrationResponseResponseBody, HttpErrorResponseBody>
}
