import { AppleIAPConfirmRequestParams } from '../../Request'
import { AppleIAPConfirmResponseBody } from './../../Response/Subscription/AppleIAPConfirmResponseBody'
import { SubscriptionInviteAcceptResponseBody } from '../../Response/Subscription/SubscriptionInviteAcceptResponseBody'
import { SubscriptionInviteCancelResponseBody } from '../../Response/Subscription/SubscriptionInviteCancelResponseBody'
import { SubscriptionInviteListResponseBody } from '../../Response/Subscription/SubscriptionInviteListResponseBody'
import { SubscriptionInviteResponseBody } from '../../Response/Subscription/SubscriptionInviteResponseBody'
import { HttpResponse } from '@standardnotes/responses'

export interface SubscriptionApiServiceInterface {
  invite(inviteeEmail: string): Promise<HttpResponse<SubscriptionInviteResponseBody>>
  listInvites(): Promise<HttpResponse<SubscriptionInviteListResponseBody>>
  cancelInvite(inviteUuid: string): Promise<HttpResponse<SubscriptionInviteCancelResponseBody>>
  acceptInvite(inviteUuid: string): Promise<HttpResponse<SubscriptionInviteAcceptResponseBody>>
  confirmAppleIAP(params: AppleIAPConfirmRequestParams): Promise<HttpResponse<AppleIAPConfirmResponseBody>>
}
