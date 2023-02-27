import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'
import { SubscriptionInviteResponseBody } from './SubscriptionInviteResponseBody'

export interface SubscriptionInviteResponse extends HttpResponse {
  data: Either<SubscriptionInviteResponseBody, HttpErrorResponseBody>
}
