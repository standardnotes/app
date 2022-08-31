import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { SubscriptionInviteListResponseBody } from './SubscriptionInviteListResponseBody'

export interface SubscriptionInviteListResponse extends HttpResponse {
  data: SubscriptionInviteListResponseBody | HttpErrorResponseBody
}
