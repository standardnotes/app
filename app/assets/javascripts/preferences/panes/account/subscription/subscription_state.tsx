import { action, computed, makeObservable, observable } from 'mobx';

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

  constructor() {
    makeObservable(this, {
      userSubscription: observable,
      availableSubscriptions: observable,

      userSubscriptionName: computed,

      setUserSubscription: action,
      setAvailableSubscriptions: action,
    });
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
    console.log('set subscription in state', subscription);
    this.userSubscription = subscription;
    console.log(this.userSubscription);
  }

  public setAvailableSubscriptions(
    subscriptions: AvailableSubscriptions
  ): void {
    this.availableSubscriptions = subscriptions;
  }
}
