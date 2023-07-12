import { AppleIAPConfirmRequestParams } from './../../Request/Subscription/AppleIAPConfirmRequestParams'
import { SubscriptionInviteAcceptRequestParams } from '../../Request/Subscription/SubscriptionInviteAcceptRequestParams'
import { SubscriptionInviteCancelRequestParams } from '../../Request/Subscription/SubscriptionInviteCancelRequestParams'
import { SubscriptionInviteDeclineRequestParams } from '../../Request/Subscription/SubscriptionInviteDeclineRequestParams'
import { SubscriptionInviteListRequestParams } from '../../Request/Subscription/SubscriptionInviteListRequestParams'
import { SubscriptionInviteRequestParams } from '../../Request/Subscription/SubscriptionInviteRequestParams'

import { AppleIAPConfirmResponseBody } from './../../Response/Subscription/AppleIAPConfirmResponseBody'
import { SubscriptionInviteAcceptResponseBody } from '../../Response/Subscription/SubscriptionInviteAcceptResponseBody'
import { SubscriptionInviteCancelResponseBody } from '../../Response/Subscription/SubscriptionInviteCancelResponseBody'
import { SubscriptionInviteDeclineResponseBody } from '../../Response/Subscription/SubscriptionInviteDeclineResponseBody'
import { SubscriptionInviteListResponseBody } from '../../Response/Subscription/SubscriptionInviteListResponseBody'
import { SubscriptionInviteResponseBody } from '../../Response/Subscription/SubscriptionInviteResponseBody'
import { GetAvailableSubscriptionsResponse, GetSubscriptionResponse, HttpResponse } from '@standardnotes/responses'
import { GetUserSubscriptionRequestParams } from '../../Request/Subscription/GetUserSubscriptionRequestParams'

export interface SubscriptionServerInterface {
  invite(params: SubscriptionInviteRequestParams): Promise<HttpResponse<SubscriptionInviteResponseBody>>
  acceptInvite(
    params: SubscriptionInviteAcceptRequestParams,
  ): Promise<HttpResponse<SubscriptionInviteAcceptResponseBody>>
  declineInvite(
    params: SubscriptionInviteDeclineRequestParams,
  ): Promise<HttpResponse<SubscriptionInviteDeclineResponseBody>>
  cancelInvite(
    params: SubscriptionInviteCancelRequestParams,
  ): Promise<HttpResponse<SubscriptionInviteCancelResponseBody>>
  listInvites(params: SubscriptionInviteListRequestParams): Promise<HttpResponse<SubscriptionInviteListResponseBody>>

  confirmAppleIAP(params: AppleIAPConfirmRequestParams): Promise<HttpResponse<AppleIAPConfirmResponseBody>>

  getUserSubscription(params: GetUserSubscriptionRequestParams): Promise<HttpResponse<GetSubscriptionResponse>>
  getAvailableSubscriptions(): Promise<HttpResponse<GetAvailableSubscriptionsResponse>>
}
