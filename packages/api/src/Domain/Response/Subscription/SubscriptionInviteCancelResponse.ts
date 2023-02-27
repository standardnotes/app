import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'
import { SubscriptionInviteCancelResponseBody } from './SubscriptionInviteCancelResponseBody'

export interface SubscriptionInviteCancelResponse extends HttpResponse {
  data: Either<SubscriptionInviteCancelResponseBody, HttpErrorResponseBody>
}
