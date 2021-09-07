import { WebApplication } from '@/ui_models/application';
import { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Subscription } from './Subscription';
import { SubscriptionState } from './subscription_state';

type Props = {
  application: WebApplication;
};

export const SubscriptionWrapper: FunctionalComponent<Props> = ({
  application,
}) => {
  const [subscriptionState] = useState(() => new SubscriptionState());
  return (
    <Subscription
      application={application}
      subscriptionState={subscriptionState}
    />
  );
};
