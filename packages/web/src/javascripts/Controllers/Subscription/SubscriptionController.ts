import { Subscription } from '@standardnotes/responses'
import { destroyAllObjectProperties } from '@/Utils'
import {
  ApplicationEvent,
  FeaturesClientInterface,
  InternalEventBusInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  Invitation,
  InvitationStatus,
  SessionsClientInterface,
  SubscriptionManagerEvent,
  SubscriptionManagerInterface,
} from '@standardnotes/snjs'
import { computed, makeObservable, observable, runInAction } from 'mobx'
import { AbstractViewController } from '../Abstract/AbstractViewController'

export class SubscriptionController extends AbstractViewController implements InternalEventHandlerInterface {
  private readonly ALLOWED_SUBSCRIPTION_INVITATIONS = 5

  subscriptionInvitations: Invitation[] | undefined = undefined
  hasAccount: boolean
  onlineSubscription: Subscription | undefined = undefined

  constructor(
    private subscriptions: SubscriptionManagerInterface,
    private sessions: SessionsClientInterface,
    private features: FeaturesClientInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
    this.hasAccount = sessions.isSignedIn()

    makeObservable(this, {
      subscriptionInvitations: observable,
      hasAccount: observable,
      onlineSubscription: observable,

      usedInvitationsCount: computed,
      allowedInvitationsCount: computed,
      allInvitationsUsed: computed,
    })

    eventBus.addEventHandler(this, ApplicationEvent.Launched)
    eventBus.addEventHandler(this, ApplicationEvent.SignedIn)
    eventBus.addEventHandler(this, ApplicationEvent.UserRolesChanged)
    eventBus.addEventHandler(this, SubscriptionManagerEvent.DidFetchSubscription)
  }

  override deinit() {
    super.deinit()
    ;(this.subscriptionInvitations as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case ApplicationEvent.Launched: {
        if (this.sessions.isSignedIn()) {
          this.reloadSubscriptionInvitations().catch(console.error)
        }
        runInAction(() => {
          this.hasAccount = this.sessions.isSignedIn()
        })
        break
      }

      case ApplicationEvent.SignedIn: {
        this.reloadSubscriptionInvitations().catch(console.error)
        runInAction(() => {
          this.hasAccount = this.sessions.isSignedIn()
        })
        break
      }

      case SubscriptionManagerEvent.DidFetchSubscription: {
        runInAction(() => {
          this.onlineSubscription = this.subscriptions.getOnlineSubscription()
        })
        break
      }

      case ApplicationEvent.UserRolesChanged: {
        this.reloadSubscriptionInvitations().catch(console.error)
        break
      }
    }
  }

  hasFirstPartyOnlineOrOfflineSubscription(): boolean {
    const offline = this.features.hasFirstPartyOfflineSubscription()
    if (!this.sessions.isSignedIn() || !this.sessions.isSignedIntoFirstPartyServer()) {
      return offline
    }
    return !!this.subscriptions.getOnlineSubscription() || offline
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

  async sendSubscriptionInvitation(inviteeEmail: string): Promise<boolean> {
    const success = await this.subscriptions.inviteToSubscription(inviteeEmail)

    if (success) {
      await this.reloadSubscriptionInvitations()
    }

    return success
  }

  async cancelSubscriptionInvitation(invitationUuid: string): Promise<boolean> {
    const success = await this.subscriptions.cancelInvitation(invitationUuid)

    if (success) {
      await this.reloadSubscriptionInvitations()
    }

    return success
  }

  private async reloadSubscriptionInvitations(): Promise<void> {
    this.subscriptionInvitations = await this.subscriptions.listSubscriptionInvitations()
  }
}
