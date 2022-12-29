import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'

import { GenerateAuthenticatorRegistrationOptionsResponseBody } from './GenerateAuthenticatorRegistrationOptionsResponseBody'

export interface GenerateAuthenticatorRegistrationOptionsResponse extends HttpResponse {
  data: Either<GenerateAuthenticatorRegistrationOptionsResponseBody, HttpErrorResponseBody>
}
