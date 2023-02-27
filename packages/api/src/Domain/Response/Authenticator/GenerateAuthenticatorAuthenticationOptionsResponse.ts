import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'

import { GenerateAuthenticatorAuthenticationOptionsResponseBody } from './GenerateAuthenticatorAuthenticationOptionsResponseBody'

export interface GenerateAuthenticatorAuthenticationOptionsResponse extends HttpResponse {
  data: Either<GenerateAuthenticatorAuthenticationOptionsResponseBody, HttpErrorResponseBody>
}
