import { ApplicationServiceInterface } from './../Service/ApplicationServiceInterface'
import { Invitation } from '@standardnotes/models'
import { AppleIAPReceipt } from './AppleIAPReceipt'
import { AvailableSubscriptions, Subscription } from '@standardnotes/responses'
import { SubscriptionManagerEvent } from './SubscriptionManagerEvent'

export interface SubscriptionManagerInterface extends ApplicationServiceInterface<SubscriptionManagerEvent, unknown> {
  getOnlineSubscription(): Subscription | undefined
  getAvailableSubscriptions(): AvailableSubscriptions | undefined
  hasOnlineSubscription(): boolean

  get userSubscriptionName(): string
  get userSubscriptionExpirationDate(): Date | undefined
  get isUserSubscriptionExpired(): boolean
  get isUserSubscriptionCanceled(): boolean

  fetchOnlineSubscription(): Promise<void>
  listSubscriptionInvitations(): Promise<Invitation[]>
  inviteToSubscription(inviteeEmail: string): Promise<boolean>
  cancelInvitation(inviteUuid: string): Promise<boolean>
  acceptInvitation(inviteUuid: string): Promise<{ success: true } | { success: false; message: string }>
  confirmAppleIAP(
    receipt: AppleIAPReceipt,
    subscriptionToken: string,
  ): Promise<{ success: true } | { success: false; message: string }>
}
