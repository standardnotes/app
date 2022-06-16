import { destroyAllObjectProperties } from '@/Utils'
import {
  ApplicationEvent,
  ClientDisplayableError,
  convertTimestampToMilliseconds,
  InternalEventBus,
} from '@standardnotes/snjs'
import { action, computed, makeObservable, observable } from 'mobx'
import { WebApplication } from '../../Application/Application'
import { AbstractViewController } from '../Abstract/AbstractViewController'
import { AvailableSubscriptions } from './AvailableSubscriptionsType'
import { Subscription } from './SubscriptionType'

export class SubscriptionController extends AbstractViewController {
  userSubscription: Subscription | undefined = undefined
  availableSubscriptions: AvailableSubscriptions | undefined = undefined

  override deinit() {
    super.deinit()
    ;(this.userSubscription as unknown) = undefined
    ;(this.availableSubscriptions as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  constructor(application: WebApplication, eventBus: InternalEventBus) {
    super(application, eventBus)

    makeObservable(this, {
      userSubscription: observable,
      availableSubscriptions: observable,

      userSubscriptionName: computed,
      userSubscriptionExpirationDate: computed,
      isUserSubscriptionExpired: computed,
      isUserSubscriptionCanceled: computed,

      setUserSubscription: action,
      setAvailableSubscriptions: action,
    })

    this.disposers.push(
      application.addEventObserver(async () => {
        if (application.hasAccount()) {
          this.getSubscriptionInfo().catch(console.error)
        }
      }, ApplicationEvent.Launched),
    )

    this.disposers.push(
      application.addEventObserver(async () => {
        this.getSubscriptionInfo().catch(console.error)
      }, ApplicationEvent.SignedIn),
    )

    this.disposers.push(
      application.addEventObserver(async () => {
        this.getSubscriptionInfo().catch(console.error)
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

  public setUserSubscription(subscription: Subscription): void {
    this.userSubscription = subscription
  }

  public setAvailableSubscriptions(subscriptions: AvailableSubscriptions): void {
    this.availableSubscriptions = subscriptions
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
}
