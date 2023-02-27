import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'
import { SubscriptionInviteListResponseBody } from './SubscriptionInviteListResponseBody'

export interface SubscriptionInviteListResponse extends HttpResponse {
  data: Either<SubscriptionInviteListResponseBody, HttpErrorResponseBody>
}
