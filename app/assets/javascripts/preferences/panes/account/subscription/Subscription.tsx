import {
  PreferencesGroup,
  PreferencesSegment,
  Title,
} from '@/preferences/components';
import { observer } from '@node_modules/mobx-react-lite';
import { WebApplication } from '@/ui_models/application';
import { useCallback, useEffect, useState } from 'preact/hooks';
import {
  GetSubscriptionResponse,
  GetSubscriptionsResponse,
} from '@standardnotes/snjs/dist/@types/services/api/responses';
import { SubscriptionState } from './subscription_state';
import { CancelledSubscription } from './CancelledSubscription';
import { ActiveSubscription } from './ActiveSubscription';
import { NoSubscription } from './NoSubscription';
import { Text } from '@/preferences/components';
import { FunctionalComponent } from 'preact';

type Props = {
  application: WebApplication;
  subscriptionState: SubscriptionState;
};

type SubscriptionInformationProps = {
  subscriptionState: SubscriptionState;
};

const SubscriptionInformation = observer(({
  subscriptionState,
}: SubscriptionInformationProps) => {
  const now = new Date().getTime();
  const { userSubscription } = subscriptionState;

  if (userSubscription && userSubscription.endsAt > now) {
    return userSubscription.cancelled ? (
      <CancelledSubscription subscriptionState={subscriptionState} />
    ) : (
      <ActiveSubscription subscriptionState={subscriptionState} />
    );
  }
  return <NoSubscription />;
});

export const Subscription: FunctionalComponent<Props> = ({ application, subscriptionState }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getSubscriptions = useCallback(async () => {
    try {
      const result = await application.getSubscriptions();
      if (result.data) {
        const data = (result as GetSubscriptionsResponse).data;
        subscriptionState.setAvailableSubscriptions(data!);
      }
    } catch (e) {
      // Error in this call will only prevent the plan name from showing
    }
  }, [application, subscriptionState]);

  const getSubscription = useCallback(async () => {
    try {
      const result = await application.getUserSubscription();
      if (!result.error && result.data) {
        const data = (result as GetSubscriptionResponse).data;
        const subscription = data!.subscription;
        subscriptionState.setUserSubscription(subscription);
      } else {
        setError(true);
      }
    } catch (e) {
      setError(true);
    }
  }, [application, subscriptionState]);

  const getSubscriptionInfo = useCallback(async () => {
    setLoading(true);
    try {
      await getSubscription();
      await getSubscriptions();
    } finally {
      setLoading(false);
    }
  }, [getSubscription, getSubscriptions]);

  useEffect(() => {
    getSubscriptionInfo();
  }, [getSubscriptionInfo]);

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex flex-row items-center">
          <div className="flex-grow flex flex-col">
            <Title>Subscription</Title>
            {error ? (
              <Text>No subscription information available.</Text>
            ) : loading ? (
              <Text>Loading subscription information...</Text>
            ) : (
              <SubscriptionInformation subscriptionState={subscriptionState} />
            )}
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
};
