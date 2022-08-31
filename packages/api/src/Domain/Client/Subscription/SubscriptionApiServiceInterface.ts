import { SubscriptionInviteResponse } from '../../Response/Subscription/SubscriptionInviteResponse'

export interface SubscriptionApiServiceInterface {
  invite(inviteeEmail: string): Promise<SubscriptionInviteResponse>
}
