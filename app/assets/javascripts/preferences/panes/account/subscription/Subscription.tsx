import {
  PreferencesGroup,
  PreferencesSegment,
  Title,
} from '@/preferences/components';
import { observer } from '@node_modules/mobx-react-lite';
import { WebApplication } from '@/ui_models/application';
import { useEffect, useState } from 'preact/hooks';
import {
  GetSubscriptionResponse,
  GetSubscriptionsResponse,
} from '@standardnotes/snjs/dist/@types/services/api/responses';
import { SubscriptionState } from './subscription_state';
import { CancelledSubscription } from './CancelledSubscription';
import { ActiveSubscription } from './ActiveSubscription';
import { NoSubscription } from './NoSubscription';

type Props = {
  application: WebApplication;
  subscriptionState: SubscriptionState;
};

type SubscriptionInformationProps = {
  subscriptionState: SubscriptionState;
};

const SubscriptionInformation = ({
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
};

export const Subscription = observer(({ application, subscriptionState }: Props) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    const getSubscriptions = async () => {
      try {
        const result = await application.getSubscriptions();
        if (result.data) {
          const data = (result as GetSubscriptionsResponse).data;
          subscriptionState.setAvailableSubscriptions(data!);
        }
      } catch (e) {
        // Error in this call will only prevent the plan name from showing
      }
    };
    const getSubscription = async () => {
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
    };
    getSubscriptions();
    getSubscription();
  }, [application, subscriptionState]);

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex flex-row items-center">
          <div className="flex-grow flex flex-col">
            <Title>Subscription</Title>
            {error ? (
              'No subscription information available.'
            ) : (
              <SubscriptionInformation subscriptionState={subscriptionState} />
            )}
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
});
