import { AppleIAPConfirmResponse } from './../../Response/Subscription/AppleIAPConfirmResponse'
import { AppleIAPConfirmRequestParams } from './../../Request/Subscription/AppleIAPConfirmRequestParams'
import { SubscriptionInviteAcceptRequestParams } from '../../Request/Subscription/SubscriptionInviteAcceptRequestParams'
import { SubscriptionInviteCancelRequestParams } from '../../Request/Subscription/SubscriptionInviteCancelRequestParams'
import { SubscriptionInviteDeclineRequestParams } from '../../Request/Subscription/SubscriptionInviteDeclineRequestParams'
import { SubscriptionInviteListRequestParams } from '../../Request/Subscription/SubscriptionInviteListRequestParams'
import { SubscriptionInviteRequestParams } from '../../Request/Subscription/SubscriptionInviteRequestParams'
import { SubscriptionInviteAcceptResponse } from '../../Response/Subscription/SubscriptionInviteAcceptResponse'
import { SubscriptionInviteCancelResponse } from '../../Response/Subscription/SubscriptionInviteCancelResponse'
import { SubscriptionInviteDeclineResponse } from '../../Response/Subscription/SubscriptionInviteDeclineResponse'
import { SubscriptionInviteListResponse } from '../../Response/Subscription/SubscriptionInviteListResponse'
import { SubscriptionInviteResponse } from '../../Response/Subscription/SubscriptionInviteResponse'

export interface SubscriptionServerInterface {
  invite(params: SubscriptionInviteRequestParams): Promise<SubscriptionInviteResponse>
  acceptInvite(params: SubscriptionInviteAcceptRequestParams): Promise<SubscriptionInviteAcceptResponse>
  declineInvite(params: SubscriptionInviteDeclineRequestParams): Promise<SubscriptionInviteDeclineResponse>
  cancelInvite(params: SubscriptionInviteCancelRequestParams): Promise<SubscriptionInviteCancelResponse>
  listInvites(params: SubscriptionInviteListRequestParams): Promise<SubscriptionInviteListResponse>
  confirmAppleIAP(params: AppleIAPConfirmRequestParams): Promise<AppleIAPConfirmResponse>
}
