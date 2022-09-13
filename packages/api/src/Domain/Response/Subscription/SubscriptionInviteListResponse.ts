import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { SubscriptionInviteListResponseBody } from './SubscriptionInviteListResponseBody'

export interface SubscriptionInviteListResponse extends HttpResponse {
  data: Either<SubscriptionInviteListResponseBody, HttpErrorResponseBody>
}
