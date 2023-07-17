import { Subscription } from '@standardnotes/responses'
import { destroyAllObjectProperties } from '@/Utils'
import {
  ApplicationEvent,
  InternalEventBusInterface,
  Invitation,
  InvitationStatus,
  SubscriptionManagerEvent,
  SubscriptionManagerInterface,
} from '@standardnotes/snjs'
import { computed, makeObservable, observable, runInAction } from 'mobx'
import { WebApplication } from '../../Application/WebApplication'
import { AbstractViewController } from '../Abstract/AbstractViewController'

export class SubscriptionController extends AbstractViewController {
  private readonly ALLOWED_SUBSCRIPTION_INVITATIONS = 5

  subscriptionInvitations: Invitation[] | undefined = undefined
  hasAccount: boolean
  onlineSubscription: Subscription | undefined = undefined

  override deinit() {
    super.deinit()
    ;(this.subscriptionInvitations as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  constructor(
    application: WebApplication,
    eventBus: InternalEventBusInterface,
    private subscriptionManager: SubscriptionManagerInterface,
  ) {
    super(application, eventBus)
    this.hasAccount = application.hasAccount()

    makeObservable(this, {
      subscriptionInvitations: observable,
      hasAccount: observable,
      onlineSubscription: observable,

      hasFirstPartyOnlineOrOfflineSubscription: computed,
      usedInvitationsCount: computed,
      allowedInvitationsCount: computed,
      allInvitationsUsed: computed,
    })

    this.disposers.push(
      application.addEventObserver(async () => {
        if (application.hasAccount()) {
          this.reloadSubscriptionInvitations().catch(console.error)
        }
        runInAction(() => {
          this.hasAccount = application.hasAccount()
        })
      }, ApplicationEvent.Launched),
    )

    this.disposers.push(
      application.addEventObserver(async () => {
        this.reloadSubscriptionInvitations().catch(console.error)
        runInAction(() => {
          this.hasAccount = application.hasAccount()
        })
      }, ApplicationEvent.SignedIn),
    )

    this.disposers.push(
      application.subscriptions.addEventObserver(async (event) => {
        if (event === SubscriptionManagerEvent.DidFetchSubscription) {
          runInAction(() => {
            this.onlineSubscription = application.subscriptions.getOnlineSubscription()
          })
        }
      }),
    )

    this.disposers.push(
      application.addEventObserver(async () => {
        this.reloadSubscriptionInvitations().catch(console.error)
      }, ApplicationEvent.UserRolesChanged),
    )
  }

  get hasFirstPartyOnlineOrOfflineSubscription(): boolean {
    if (this.application.sessions.isSignedIn()) {
      if (!this.application.sessions.isSignedIntoFirstPartyServer()) {
        return false
      }

      return this.application.subscriptions.getOnlineSubscription() !== undefined
    } else {
      return this.application.features.hasFirstPartyOfflineSubscription()
    }
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

  private async reloadSubscriptionInvitations(): Promise<void> {
    this.subscriptionInvitations = await this.subscriptionManager.listSubscriptionInvitations()
  }
}
