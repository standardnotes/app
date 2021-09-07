import {
  PreferencesGroup,
  PreferencesSegment,
  Text,
  Title,
} from '@/preferences/components';
import { Button } from '@/components/Button';
import { observer } from '@node_modules/mobx-react-lite';
import { WebApplication } from '@/ui_models/application';
import { useEffect, useState } from 'preact/hooks';
import {
  GetSubscriptionResponse,
  GetSubscriptionsResponse,
} from '@standardnotes/snjs/dist/@types/services/api/responses';

type Props = {
  application: WebApplication;
};

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

type SubscriptionInformationProps = {
  subscription?: Subscription;
  availableSubscriptions: AvailableSubscriptions;
};

type ValidSubscriptionProps = {
  subscription: Subscription;
  availableSubscriptions: AvailableSubscriptions;
};

const NoSubscription = () => (
  <>
    <Text>You don't have a Standard Notes subscription yet.</Text>
    <div className="flex">
      <Button
        className="min-w-20 mt-3 mr-3"
        type="normal"
        label="Refresh"
        onClick={() => null}
      />
      <Button
        className="min-w-20 mt-3"
        type="primary"
        label="Purchase subscription"
        onClick={() => null}
      />
    </div>
  </>
);

const ActiveSubscription = ({
  subscription,
  availableSubscriptions,
}: ValidSubscriptionProps) => (
  <>
    <Text>
      Your{' '}
      <span className="font-bold">
        Standard Notes {availableSubscriptions[subscription.planName]}
      </span>{' '}
      subscription will be{' '}
      <span className="font-bold">
        renewed on {new Date(subscription.endsAt).toLocaleString()}
      </span>
      .
    </Text>
    <div className="flex">
      <Button
        className="min-w-20 mt-3 mr-3"
        type="normal"
        label="Refresh"
        onClick={() => null}
      />
      <Button
        className="min-w-20 mt-3 mr-3"
        type="normal"
        label="Change plan"
        onClick={() => null}
      />
      <Button
        className="min-w-20 mt-3"
        type="primary"
        label="Cancel subscription"
        onClick={() => null}
      />
    </div>
  </>
);

const CancelledSubscription = ({
  subscription,
  availableSubscriptions,
}: ValidSubscriptionProps) => (
  <>
    <Text>
      Your{' '}
      <span className="font-bold">
        Standard Notes {availableSubscriptions[subscription.planName]}
      </span>{' '}
      subscription has been{' '}
      <span className="font-bold">
        canceled but will remain valid until{' '}
        {new Date(subscription.endsAt).toLocaleString()}
      </span>
      . You may resubscribe below if you wish.
    </Text>
    <div className="flex">
      <Button
        className="min-w-20 mt-3 mr-3"
        type="normal"
        label="Refresh"
        onClick={() => null}
      />
      <Button
        className="min-w-20 mt-3 mr-3"
        type="normal"
        label="Change plan"
        onClick={() => null}
      />
      <Button
        className="min-w-20 mt-3"
        type="primary"
        label="Renew subscription"
        onClick={() => null}
      />
    </div>
  </>
);

const SubscriptionInformation = ({
  subscription,
  availableSubscriptions,
}: SubscriptionInformationProps) => {
  const now = new Date().getTime();
  if (subscription && subscription.endsAt > now) {
    return subscription.cancelled ? (
      <CancelledSubscription
        subscription={subscription}
        availableSubscriptions={availableSubscriptions}
      />
    ) : (
      <ActiveSubscription
        subscription={subscription}
        availableSubscriptions={availableSubscriptions}
      />
    );
  }
  return <NoSubscription />;
};

const Subscription = observer(({ application }: Props) => {
  const [subscription, setSubscription] =
    useState<Subscription | undefined>(undefined);
  const [availableSubscriptions, setAvailableSubscriptions] =
    useState<AvailableSubscriptions>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    const getSubscriptions = async () => {
      try {
        const result = await application.getSubscriptions();
        if (result.data) {
          const data = (result as GetSubscriptionsResponse).data;
          setAvailableSubscriptions(data!);
        } else {
          setError(true);
        }
      } catch (e) {
        setError(true);
      }
    };
    const getSubscription = async () => {
      try {
        const result = await application.getUserSubscription();
        if (!result.error && result.data) {
          const data = (result as GetSubscriptionResponse).data;
          const subscription = data!.subscription;
          setSubscription(subscription);
        } else {
          setError(true);
        }
      } catch (e) {
        setError(true);
      }
    };
    getSubscriptions();
    getSubscription();
  }, [application]);

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex flex-row items-center">
          <div className="flex-grow flex flex-col">
            <Title>Subscription</Title>
            {error ? (
              'No subscription information available.'
            ) : (
              <SubscriptionInformation
                subscription={subscription}
                availableSubscriptions={availableSubscriptions}
              />
            )}
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
});

export default Subscription;
