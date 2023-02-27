import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'
import { SubscriptionInviteAcceptResponseBody } from './SubscriptionInviteAcceptResponseBody'

export interface SubscriptionInviteAcceptResponse extends HttpResponse {
  data: Either<SubscriptionInviteAcceptResponseBody, HttpErrorResponseBody>
}
