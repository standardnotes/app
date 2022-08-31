import { SubscriptionInviteRequestParams } from '../../Request/Subscription/SubscriptionInviteRequestParams'
import { SubscriptionInviteResponse } from '../../Response/Subscription/SubscriptionInviteResponse'

export interface SubscriptionServerInterface {
  invite(params: SubscriptionInviteRequestParams): Promise<SubscriptionInviteResponse>
}
