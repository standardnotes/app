import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { AppleIAPConfirmResponseBody } from './AppleIAPConfirmResponseBody'

export interface AppleIAPConfirmResponse extends HttpResponse {
  data: Either<AppleIAPConfirmResponseBody, HttpErrorResponseBody>
}
