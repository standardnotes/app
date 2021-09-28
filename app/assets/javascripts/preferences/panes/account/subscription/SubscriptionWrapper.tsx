import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Subscription } from './Subscription';
import { SubscriptionState } from './subscription_state';

type Props = {
  application: WebApplication;
  appState: AppState;
};

export const SubscriptionWrapper: FunctionalComponent<Props> = ({
  application,
  appState,
}) => {
  const [subscriptionState] = useState(() => new SubscriptionState());
  return (
    <Subscription
      application={application}
      appState={appState}
      subscriptionState={subscriptionState}
    />
  );
};
