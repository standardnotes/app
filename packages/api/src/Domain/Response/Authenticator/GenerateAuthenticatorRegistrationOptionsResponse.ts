import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'

import { GenerateAuthenticatorRegistrationOptionsResponseBody } from './GenerateAuthenticatorRegistrationOptionsResponseBody'

export interface GenerateAuthenticatorRegistrationOptionsResponse extends HttpResponse {
  data: Either<GenerateAuthenticatorRegistrationOptionsResponseBody, HttpErrorResponseBody>
}
