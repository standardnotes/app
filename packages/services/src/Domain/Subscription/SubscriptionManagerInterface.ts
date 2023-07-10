import { Invitation } from '@standardnotes/models'
import { AppleIAPReceipt } from './AppleIAPReceipt'
import { AvailableSubscriptions } from '@standardnotes/responses'
import { Subscription } from '@standardnotes/security'

export interface SubscriptionManagerInterface {
  getOnlineSubscription(): Subscription | undefined
  getAvailableSubscriptions(): AvailableSubscriptions | undefined
  hasValidSubscription(): boolean

  get userSubscriptionName(): string
  get userSubscriptionExpirationDate(): Date | undefined
  get isUserSubscriptionExpired(): boolean
  get isUserSubscriptionCanceled(): boolean

  listSubscriptionInvitations(): Promise<Invitation[]>
  inviteToSubscription(inviteeEmail: string): Promise<boolean>
  cancelInvitation(inviteUuid: string): Promise<boolean>
  acceptInvitation(inviteUuid: string): Promise<{ success: true } | { success: false; message: string }>
  confirmAppleIAP(
    receipt: AppleIAPReceipt,
    subscriptionToken: string,
  ): Promise<{ success: true } | { success: false; message: string }>
}
