import { destroyAllObjectProperties } from '@/Utils'
import {
  ApplicationEvent,
  ClientDisplayableError,
  convertTimestampToMilliseconds,
  InternalEventBusInterface,
  Invitation,
  InvitationStatus,
  SubscriptionClientInterface,
} from '@standardnotes/snjs'
import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import { WebApplication } from '../../Application/WebApplication'
import { AbstractViewController } from '../Abstract/AbstractViewController'
import { AvailableSubscriptions } from './AvailableSubscriptionsType'
import { Subscription } from './SubscriptionType'

export class SubscriptionController extends AbstractViewController {
  private readonly ALLOWED_SUBSCRIPTION_INVITATIONS = 5

  onlineSubscription: Subscription | undefined = undefined
  availableSubscriptions: AvailableSubscriptions | undefined = undefined
  subscriptionInvitations: Invitation[] | undefined = undefined
  hasAccount: boolean
  hasFirstPartySubscription: boolean

  override deinit() {
    super.deinit()
    ;(this.onlineSubscription as unknown) = undefined
    ;(this.availableSubscriptions as unknown) = undefined
    ;(this.subscriptionInvitations as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  constructor(
    application: WebApplication,
    eventBus: InternalEventBusInterface,
    private subscriptionManager: SubscriptionClientInterface,
  ) {
    super(application, eventBus)
    this.hasAccount = application.hasAccount()
    this.hasFirstPartySubscription = application.features.hasFirstPartySubscription()

    makeObservable(this, {
      onlineSubscription: observable,
      availableSubscriptions: observable,
      subscriptionInvitations: observable,
      hasAccount: observable,
      hasFirstPartySubscription: observable,

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
        runInAction(() => {
          this.hasFirstPartySubscription = application.features.hasFirstPartySubscription()
          this.hasAccount = application.hasAccount()
        })
      }, ApplicationEvent.Launched),
    )

    this.disposers.push(
      application.addEventObserver(async () => {
        runInAction(() => {
          this.hasFirstPartySubscription = application.features.hasFirstPartySubscription()
        })
      }, ApplicationEvent.LocalDataLoaded),
    )

    this.disposers.push(
      application.addEventObserver(async () => {
        this.getSubscriptionInfo().catch(console.error)
        this.reloadSubscriptionInvitations().catch(console.error)
        runInAction(() => {
          this.hasAccount = application.hasAccount()
        })
      }, ApplicationEvent.SignedIn),
    )

    this.disposers.push(
      application.addEventObserver(async () => {
        this.getSubscriptionInfo().catch(console.error)
        this.reloadSubscriptionInvitations().catch(console.error)
        runInAction(() => {
          this.hasFirstPartySubscription = application.features.hasFirstPartySubscription()
        })
      }, ApplicationEvent.UserRolesChanged),
    )
  }

  get userSubscriptionName(): string {
    if (
      this.availableSubscriptions &&
      this.onlineSubscription &&
      this.availableSubscriptions[this.onlineSubscription.planName]
    ) {
      return this.availableSubscriptions[this.onlineSubscription.planName].name
    }
    return ''
  }

  get userSubscriptionExpirationDate(): Date | undefined {
    if (!this.onlineSubscription) {
      return undefined
    }

    return new Date(convertTimestampToMilliseconds(this.onlineSubscription.endsAt))
  }

  get isUserSubscriptionExpired(): boolean {
    if (!this.userSubscriptionExpirationDate) {
      return false
    }

    return this.userSubscriptionExpirationDate.getTime() < new Date().getTime()
  }

  get isUserSubscriptionCanceled(): boolean {
    return Boolean(this.onlineSubscription?.cancelled)
  }

  hasValidSubscription(): boolean {
    return this.onlineSubscription != undefined && !this.isUserSubscriptionExpired && !this.isUserSubscriptionCanceled
  }

  get usedInvitationsCount(): number {
    return (
      this.subscriptionInvitations?.filter((invitation) =>
        [InvitationStatus.Accepted, InvitationStatus.Sent].includes(invitation.status),
      ).length ?? 0
    )
  }

  get allowedInvitationsCount(): number {
    return this.ALLOWED_SUBSCRIPTION_INVITATIONS
  }

  get allInvitationsUsed(): boolean {
    return this.usedInvitationsCount === this.ALLOWED_SUBSCRIPTION_INVITATIONS
  }

  public setUserSubscription(subscription: Subscription): void {
    this.onlineSubscription = subscription
  }

  public setAvailableSubscriptions(subscriptions: AvailableSubscriptions): void {
    this.availableSubscriptions = subscriptions
  }

  async sendSubscriptionInvitation(inviteeEmail: string): Promise<boolean> {
    const success = await this.subscriptionManager.inviteToSubscription(inviteeEmail)

    if (success) {
      await this.reloadSubscriptionInvitations()
    }

    return success
  }

  async cancelSubscriptionInvitation(invitationUuid: string): Promise<boolean> {
    const success = await this.subscriptionManager.cancelInvitation(invitationUuid)

    if (success) {
      await this.reloadSubscriptionInvitations()
    }

    return success
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
      if (!(subscription instanceof ClientDisplayableError) && subscription) {
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
