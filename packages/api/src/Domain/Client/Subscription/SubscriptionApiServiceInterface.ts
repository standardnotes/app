import { AppleIAPConfirmRequestParams } from '../../Request'
import { AppleIAPConfirmResponseBody } from './../../Response/Subscription/AppleIAPConfirmResponseBody'
import { SubscriptionInviteAcceptResponseBody } from '../../Response/Subscription/SubscriptionInviteAcceptResponseBody'
import { SubscriptionInviteCancelResponseBody } from '../../Response/Subscription/SubscriptionInviteCancelResponseBody'
import { SubscriptionInviteListResponseBody } from '../../Response/Subscription/SubscriptionInviteListResponseBody'
import { SubscriptionInviteResponseBody } from '../../Response/Subscription/SubscriptionInviteResponseBody'
import { GetAvailableSubscriptionsResponse, GetSubscriptionResponse, HttpResponse } from '@standardnotes/responses'
import { GetUserSubscriptionRequestParams } from '../../Request/Subscription/GetUserSubscriptionRequestParams'

export interface SubscriptionApiServiceInterface {
  invite(inviteeEmail: string): Promise<HttpResponse<SubscriptionInviteResponseBody>>
  listInvites(): Promise<HttpResponse<SubscriptionInviteListResponseBody>>
  cancelInvite(inviteUuid: string): Promise<HttpResponse<SubscriptionInviteCancelResponseBody>>
  acceptInvite(inviteUuid: string): Promise<HttpResponse<SubscriptionInviteAcceptResponseBody>>
  confirmAppleIAP(params: AppleIAPConfirmRequestParams): Promise<HttpResponse<AppleIAPConfirmResponseBody>>
  getUserSubscription(params: GetUserSubscriptionRequestParams): Promise<HttpResponse<GetSubscriptionResponse>>
  getAvailableSubscriptions(): Promise<HttpResponse<GetAvailableSubscriptionsResponse>>
}
