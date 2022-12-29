import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'

import { GenerateAuthenticatorAuthenticationOptionsResponseBody } from './GenerateAuthenticatorAuthenticationOptionsResponseBody'

export interface GenerateAuthenticatorAuthenticationOptionsResponse extends HttpResponse {
  data: Either<GenerateAuthenticatorAuthenticationOptionsResponseBody, HttpErrorResponseBody>
}
