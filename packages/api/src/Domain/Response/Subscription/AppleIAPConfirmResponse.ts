import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'
import { AppleIAPConfirmResponseBody } from './AppleIAPConfirmResponseBody'

export interface AppleIAPConfirmResponse extends HttpResponse {
  data: Either<AppleIAPConfirmResponseBody, HttpErrorResponseBody>
}
