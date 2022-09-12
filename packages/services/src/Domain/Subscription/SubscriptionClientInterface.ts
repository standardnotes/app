import { Invitation } from '@standardnotes/models'

export interface SubscriptionClientInterface {
  listSubscriptionInvitations(): Promise<Invitation[]>
}
