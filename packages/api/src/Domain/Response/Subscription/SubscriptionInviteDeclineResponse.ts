import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody, HttpResponse } from '@standardnotes/responses'
import { SubscriptionInviteDeclineResponseBody } from './SubscriptionInviteDeclineResponseBody'

export interface SubscriptionInviteDeclineResponse extends HttpResponse {
  data: Either<SubscriptionInviteDeclineResponseBody, HttpErrorResponseBody>
}
