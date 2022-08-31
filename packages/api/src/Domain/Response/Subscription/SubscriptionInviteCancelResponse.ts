import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { SubscriptionInviteCancelResponseBody } from './SubscriptionInviteCancelResponseBody'

export interface SubscriptionInviteCancelResponse extends HttpResponse {
  data: SubscriptionInviteCancelResponseBody | HttpErrorResponseBody
}
