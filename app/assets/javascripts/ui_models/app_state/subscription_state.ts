import { ApplicationEvent } from '@standardnotes/snjs';
import { action, computed, makeObservable, observable } from 'mobx';
import { WebApplication } from '../application';

type Subscription = {
  planName: string;
  cancelled: boolean;
  endsAt: number;
};

type AvailableSubscriptions = {
  [key: string]: {
    name: string;
  };
};

export class SubscriptionState {
  userSubscription: Subscription | undefined = undefined;
  availableSubscriptions: AvailableSubscriptions | undefined = undefined;

  constructor(
    private application: WebApplication,
    appObservers: (() => void)[]
  ) {
    makeObservable(this, {
      userSubscription: observable,
      availableSubscriptions: observable,

      userSubscriptionName: computed,

      setUserSubscription: action,
      setAvailableSubscriptions: action,
    });

    appObservers.push(
      application.addEventObserver(async () => {
        if (application.hasAccount()) {
          await this.getSubscriptionInfo();
        }
      }, ApplicationEvent.Launched),
      application.addEventObserver(async () => {
        await this.getSubscriptionInfo();
      }, ApplicationEvent.SignedIn),
      application.addEventObserver(async () => {
        await this.getSubscriptionInfo();
      }, ApplicationEvent.UserRolesChanged)
    );
  }

  get userSubscriptionName(): string {
    if (
      this.availableSubscriptions &&
      this.userSubscription &&
      this.availableSubscriptions[this.userSubscription.planName]
    ) {
      return this.availableSubscriptions[this.userSubscription.planName].name;
    }
    return '';
  }

  public setUserSubscription(subscription: Subscription): void {
    this.userSubscription = subscription;
  }

  public setAvailableSubscriptions(
    subscriptions: AvailableSubscriptions
  ): void {
    this.availableSubscriptions = subscriptions;
  }

  private async getAvailableSubscriptions() {
    try {
      const subscriptions = await this.application.getAvailableSubscriptions();
      if (subscriptions) {
        this.setAvailableSubscriptions(subscriptions);
      }
    } catch (error) {
      console.error(error);
    }
  }

  private async getSubscription() {
    try {
      const subscription = await this.application.getUserSubscription();
      if (subscription) {
        this.setUserSubscription(subscription);
      }
    } catch (error) {
      console.error(error);
    }
  }

  private async getSubscriptionInfo() {
    await this.getSubscription();
    await this.getAvailableSubscriptions();
  }
}
