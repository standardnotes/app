import { Uuid } from '@standardnotes/common'
import { Invitation } from '@standardnotes/models'
import { AppleIAPReceipt } from './AppleIAPReceipt'

export interface SubscriptionClientInterface {
  listSubscriptionInvitations(): Promise<Invitation[]>
  inviteToSubscription(inviteeEmail: string): Promise<boolean>
  cancelInvitation(inviteUuid: Uuid): Promise<boolean>
  acceptInvitation(inviteUuid: Uuid): Promise<{ success: true } | { success: false; message: string }>
  confirmAppleIAP(
    receipt: AppleIAPReceipt,
    subscriptionToken: string,
  ): Promise<{ success: true } | { success: false; message: string }>
}
