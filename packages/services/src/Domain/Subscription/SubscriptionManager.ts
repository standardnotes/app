import { SessionEvent } from './../Session/SessionEvent'
import { StorageKey } from './../Storage/StorageKeys'
import { ApplicationStage } from './../Application/ApplicationStage'
import { StorageServiceInterface } from './../Storage/StorageServiceInterface'
import { InternalEventInterface } from './../Internal/InternalEventInterface'
import { SessionsClientInterface } from './../Session/SessionsClientInterface'
import { SubscriptionName } from '@standardnotes/common'
import { convertTimestampToMilliseconds } from '@standardnotes/utils'
import { ApplicationEvent } from './../Event/ApplicationEvent'
import { InternalEventHandlerInterface } from './../Internal/InternalEventHandlerInterface'
import { Invitation } from '@standardnotes/models'
import { SubscriptionApiServiceInterface } from '@standardnotes/api'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { AbstractService } from '../Service/AbstractService'
import { SubscriptionManagerInterface } from './SubscriptionManagerInterface'
import { AppleIAPReceipt } from './AppleIAPReceipt'
import {
  AvailableSubscriptions,
  getErrorFromErrorResponse,
  isErrorResponse,
  Subscription,
} from '@standardnotes/responses'
import { SubscriptionManagerEvent } from './SubscriptionManagerEvent'
import { ApplicationStageChangedEventPayload } from '../Event/ApplicationStageChangedEventPayload'
import { IsApplicationUsingThirdPartyHost } from '../UseCase/IsApplicationUsingThirdPartyHost'

export class SubscriptionManager
  extends AbstractService<SubscriptionManagerEvent>
  implements SubscriptionManagerInterface, InternalEventHandlerInterface
{
  private onlineSubscription?: Subscription
  private availableSubscriptions?: AvailableSubscriptions | undefined

  constructor(
    private subscriptionApiService: SubscriptionApiServiceInterface,
    private sessions: SessionsClientInterface,
    private storage: StorageServiceInterface,
    private isApplicationUsingThirdPartyHostUseCase: IsApplicationUsingThirdPartyHost,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case ApplicationEvent.Launched: {
        void this.fetchOnlineSubscription()

        const isThirdPartyHostUsedOrError = this.isApplicationUsingThirdPartyHostUseCase.execute()
        if (isThirdPartyHostUsedOrError.isFailed()) {
          break
        }
        const isThirdPartyHostUsed = isThirdPartyHostUsedOrError.getValue()
        if (!isThirdPartyHostUsed) {
          void this.fetchAvailableSubscriptions()
        }
        break
      }

      case ApplicationEvent.UserRolesChanged:
      case SessionEvent.Restored:
      case ApplicationEvent.SignedIn:
        void this.fetchOnlineSubscription()
        break

      case ApplicationEvent.ApplicationStageChanged: {
        const stage = (event.payload as ApplicationStageChangedEventPayload).stage
        if (stage === ApplicationStage.StorageDecrypted_09) {
          this.loadSubscriptionFromStorage()
        }
      }
    }
  }

  loadSubscriptionFromStorage(): void {
    this.onlineSubscription = this.storage.getValue(StorageKey.Subscription)
    void this.notifyEvent(SubscriptionManagerEvent.DidFetchSubscription)
  }

  hasOnlineSubscription(): boolean {
    return this.onlineSubscription != undefined
  }

  getOnlineSubscription(): Subscription | undefined {
    return this.onlineSubscription
  }

  getAvailableSubscriptions(): AvailableSubscriptions | undefined {
    return this.availableSubscriptions
  }

  get userSubscriptionName(): string {
    if (!this.onlineSubscription) {
      throw new Error('Attempting to get subscription name without a subscription.')
    }

    if (
      this.availableSubscriptions &&
      this.availableSubscriptions[this.onlineSubscription.planName as SubscriptionName]
    ) {
      return this.availableSubscriptions[this.onlineSubscription.planName as SubscriptionName].name
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
    if (!this.onlineSubscription) {
      throw new Error('Attempting to check subscription expiration without a subscription.')
    }

    if (!this.userSubscriptionExpirationDate) {
      return false
    }

    return this.userSubscriptionExpirationDate.getTime() < new Date().getTime()
  }

  get isUserSubscriptionCanceled(): boolean {
    if (!this.onlineSubscription) {
      throw new Error('Attempting to check subscription expiration without a subscription.')
    }

    return this.onlineSubscription.cancelled
  }

  async acceptInvitation(inviteUuid: string): Promise<{ success: true } | { success: false; message: string }> {
    try {
      const result = await this.subscriptionApiService.acceptInvite(inviteUuid)

      if (isErrorResponse(result)) {
        return { success: false, message: getErrorFromErrorResponse(result).message }
      }

      return result.data
    } catch (error) {
      return { success: false, message: 'Could not accept invitation.' }
    }
  }

  async listSubscriptionInvitations(): Promise<Invitation[]> {
    try {
      const result = await this.subscriptionApiService.listInvites()

      if (isErrorResponse(result)) {
        return []
      }

      return result.data.invitations ?? []
    } catch (error) {
      return []
    }
  }

  async inviteToSubscription(inviteeEmail: string): Promise<boolean> {
    try {
      const result = await this.subscriptionApiService.invite(inviteeEmail)

      if (isErrorResponse(result)) {
        return false
      }

      return result.data.success === true
    } catch (error) {
      return false
    }
  }

  async cancelInvitation(inviteUuid: string): Promise<boolean> {
    try {
      const result = await this.subscriptionApiService.cancelInvite(inviteUuid)

      if (isErrorResponse(result)) {
        return false
      }

      return result.data.success === true
    } catch (error) {
      return false
    }
  }

  public async fetchOnlineSubscription(): Promise<void> {
    if (!this.sessions.isSignedIn()) {
      return
    }

    try {
      const result = await this.subscriptionApiService.getUserSubscription({ userUuid: this.sessions.userUuid })

      if (isErrorResponse(result)) {
        return
      }

      const subscription = result.data.subscription

      this.handleReceivedOnlineSubscriptionFromServer(subscription)
    } catch (error) {
      void error
    }
  }

  private handleReceivedOnlineSubscriptionFromServer(subscription: Subscription | undefined): void {
    this.onlineSubscription = subscription

    this.storage.setValue(StorageKey.Subscription, subscription)

    void this.notifyEvent(SubscriptionManagerEvent.DidFetchSubscription)
  }

  async fetchAvailableSubscriptions(): Promise<void> {
    try {
      const response = await this.subscriptionApiService.getAvailableSubscriptions()

      if (isErrorResponse(response)) {
        return
      }

      this.availableSubscriptions = response.data
    } catch (error) {
      void error
    }
  }

  async confirmAppleIAP(
    params: AppleIAPReceipt,
    subscriptionToken: string,
  ): Promise<{ success: true } | { success: false; message: string }> {
    try {
      const result = await this.subscriptionApiService.confirmAppleIAP({
        ...params,
        subscription_token: subscriptionToken,
      })

      if (isErrorResponse(result)) {
        return { success: false, message: getErrorFromErrorResponse(result).message }
      }

      return result.data
    } catch (error) {
      return { success: false, message: 'Could not confirm IAP.' }
    }
  }
}
