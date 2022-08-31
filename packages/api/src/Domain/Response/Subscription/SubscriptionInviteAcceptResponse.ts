import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { SubscriptionInviteAcceptResponseBody } from './SubscriptionInviteAcceptResponseBody'

export interface SubscriptionInviteAcceptResponse extends HttpResponse {
  data: SubscriptionInviteAcceptResponseBody | HttpErrorResponseBody
}
