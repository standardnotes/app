import { Uuid } from '@standardnotes/common'
import { SubscriptionInviteCancelResponse } from '../../Response/Subscription/SubscriptionInviteCancelResponse'
import { SubscriptionInviteListResponse } from '../../Response/Subscription/SubscriptionInviteListResponse'

import { SubscriptionInviteResponse } from '../../Response/Subscription/SubscriptionInviteResponse'

export interface SubscriptionApiServiceInterface {
  invite(inviteeEmail: string): Promise<SubscriptionInviteResponse>
  listInvites(): Promise<SubscriptionInviteListResponse>
  cancelInvite(inviteUuid: Uuid): Promise<SubscriptionInviteCancelResponse>
}
