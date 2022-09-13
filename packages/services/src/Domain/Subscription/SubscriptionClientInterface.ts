import { Uuid } from '@standardnotes/common'
import { Invitation } from '@standardnotes/models'

export interface SubscriptionClientInterface {
  listSubscriptionInvitations(): Promise<Invitation[]>
  inviteToSubscription(inviteeEmail: string): Promise<boolean>
  cancelInvitation(inviteUuid: Uuid): Promise<boolean>
}
