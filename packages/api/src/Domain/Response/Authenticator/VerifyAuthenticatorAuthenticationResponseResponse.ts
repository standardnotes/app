import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'

import { VerifyAuthenticatorAuthenticationResponseResponseBody } from './VerifyAuthenticatorAuthenticationResponseResponseBody'

export interface VerifyAuthenticatorAuthenticationResponseResponse extends HttpResponse {
  data: Either<VerifyAuthenticatorAuthenticationResponseResponseBody, HttpErrorResponseBody>
}
