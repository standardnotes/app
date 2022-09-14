import { destroyAllObjectProperties } from '@/Utils'
import {
  ApplicationEvent,
  ClientDisplayableError,
  convertTimestampToMilliseconds,
  InternalEventBus,
  Invitation,
  InvitationStatus,
  SubscriptionClientInterface,
  Uuid,
} from '@standardnotes/snjs'
import { action, computed, makeObservable, observable } from 'mobx'
import { WebApplication } from '../../Application/Application'
import { AbstractViewController } from '../Abstract/AbstractViewController'
import { AvailableSubscriptions } from './AvailableSubscriptionsType'
import { Subscription } from './SubscriptionType'

export class SubscriptionController extends AbstractViewController {
  private readonly ALLOWED_SUBSCRIPTION_INVITATIONS = 5

  userSubscription: Subscription | undefined = undefined
  availableSubscriptions: AvailableSubscriptions | undefined = undefined
  subscriptionInvitations: Invitation[] | undefined = undefined

  override deinit() {
    super.deinit()
    ;(this.userSubscription as unknown) = undefined
    ;(this.availableSubscriptions as unknown) = undefined
    ;(this.subscriptionInvitations as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  constructor(application: WebApplication, eventBus: InternalEventBus, private subscriptionManager: SubscriptionClientInterface) {
    super(application, eventBus)

    makeObservable(this, {
      userSubscription: observable,
      availableSubscriptions: observable,
      subscriptionInvitations: observable,

      userSubscriptionName: computed,
      userSubscriptionExpirationDate: computed,
      isUserSubscriptionExpired: computed,
      isUserSubscriptionCanceled: computed,
      usedInvitationsCount: computed,
      allowedInvitationsCount: computed,
      allInvitationsUsed: computed,

      setUserSubscription: action,
      setAvailableSubscriptions: action,
    })

    this.disposers.push(
      application.addEventObserver(async () => {
        if (application.hasAccount()) {
          this.getSubscriptionInfo().catch(console.error)
          this.reloadSubscriptionInvitations().catch(console.error)
        }
      }, ApplicationEvent.Launched),
    )

    this.disposers.push(
      application.addEventObserver(async () => {
        this.getSubscriptionInfo().catch(console.error)
        this.reloadSubscriptionInvitations().catch(console.error)
      }, ApplicationEvent.SignedIn),
    )

    this.disposers.push(
      application.addEventObserver(async () => {
        this.getSubscriptionInfo().catch(console.error)
        this.reloadSubscriptionInvitations().catch(console.error)
      }, ApplicationEvent.UserRolesChanged),
    )
  }

  get userSubscriptionName(): string {
    if (
      this.availableSubscriptions &&
      this.userSubscription &&
      this.availableSubscriptions[this.userSubscription.planName]
    ) {
      return this.availableSubscriptions[this.userSubscription.planName].name
    }
    return ''
  }

  get userSubscriptionExpirationDate(): Date | undefined {
    if (!this.userSubscription) {
      return undefined
    }

    return new Date(convertTimestampToMilliseconds(this.userSubscription.endsAt))
  }

  get isUserSubscriptionExpired(): boolean {
    if (!this.userSubscriptionExpirationDate) {
      return false
    }

    return this.userSubscriptionExpirationDate.getTime() < new Date().getTime()
  }

  get isUserSubscriptionCanceled(): boolean {
    return Boolean(this.userSubscription?.cancelled)
  }

  get usedInvitationsCount(): number {
    return this.subscriptionInvitations?.filter(
      invitation =>
        [InvitationStatus.Accepted, InvitationStatus.Sent].includes(invitation.status)
      ).length ?? 0
  }

  get allowedInvitationsCount(): number {
    return this.ALLOWED_SUBSCRIPTION_INVITATIONS
  }

  get allInvitationsUsed(): boolean {
    return this.usedInvitationsCount === this.ALLOWED_SUBSCRIPTION_INVITATIONS
  }

  public setUserSubscription(subscription: Subscription): void {
    this.userSubscription = subscription
  }

  public setAvailableSubscriptions(subscriptions: AvailableSubscriptions): void {
    this.availableSubscriptions = subscriptions
  }

  async sendSubscriptionInvitation(inviteeEmail: string): Promise<boolean> {
    return this.subscriptionManager.inviteToSubscription(inviteeEmail)
  }

  async cancelSubscriptionInvitation(invitationUuid: Uuid): Promise<boolean> {
    return this.subscriptionManager.cancelInvitation(invitationUuid)
  }

  private async getAvailableSubscriptions() {
    try {
      const subscriptions = await this.application.getAvailableSubscriptions()
      if (!(subscriptions instanceof ClientDisplayableError)) {
        this.setAvailableSubscriptions(subscriptions)
      }
    } catch (error) {
      console.error(error)
    }
  }

  private async getSubscription() {
    try {
      const subscription = await this.application.getUserSubscription()
      if (!(subscription instanceof ClientDisplayableError)) {
        this.setUserSubscription(subscription)
      }
    } catch (error) {
      console.error(error)
    }
  }

  private async getSubscriptionInfo() {
    await this.getSubscription()
    await this.getAvailableSubscriptions()
  }

  private async reloadSubscriptionInvitations(): Promise<void> {
    this.subscriptionInvitations = await this.subscriptionManager.listSubscriptionInvitations()
  }
}
