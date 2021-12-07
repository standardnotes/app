import { observer } from 'mobx-react-lite';
import { SubscriptionState } from './subscription_state';
import { Text } from '@/preferences/components';
import { Button } from '@/components/Button';
import { WebApplication } from '@/ui_models/application';
import { convertTimestampToMilliseconds } from '@standardnotes/snjs';
import { openSubscriptionDashboard } from '@/hooks/manageSubscription';

type Props = {
  subscriptionState: SubscriptionState;
  application?: WebApplication;
};

const StatusText = observer(({ subscriptionState }: Props) => {
  const { userSubscription, userSubscriptionName } = subscriptionState;
  const expirationDate = new Date(
    convertTimestampToMilliseconds(userSubscription!.endsAt)
  );
  const expirationDateString = expirationDate.toLocaleString();
  const expired = expirationDate.getTime() < new Date().getTime();
  const canceled = userSubscription!.cancelled;

  if (canceled) {
    return (
      <Text className="mt-1">
        Your{' '}
        <span className="font-bold">
          Standard Notes{userSubscriptionName ? ' ' : ''}
          {userSubscriptionName}
        </span>{' '}
        subscription has been canceled
        {' '}
        {expired ? (
          <span className="font-bold">
            and expired on {expirationDateString}
          </span>
        ) : (
          <span className="font-bold">
            but will remain valid until {expirationDateString}
          </span>
        )}
        . You may resubscribe below if you wish.
      </Text>
    );
  }

  if (expired) {
    return (
      <Text className="mt-1">
        Your{' '}
        <span className="font-bold">
          Standard Notes{userSubscriptionName ? ' ' : ''}
          {userSubscriptionName}
        </span>{' '}
        subscription {' '}
        <span className="font-bold">
          expired on {expirationDateString}
        </span>
        . You may resubscribe below if you wish.
      </Text>
    );
  }

  return (
    <Text className="mt-1">
      Your{' '}
      <span className="font-bold">
        Standard Notes{userSubscriptionName ? ' ' : ''}
        {userSubscriptionName}
      </span>{' '}
      subscription will be{' '}
      <span className="font-bold">renewed on {expirationDateString}</span>.
    </Text>
  );
});

export const SubscriptionInformation = observer(
  ({ subscriptionState, application }: Props) => {
    const manageSubscription = async () => {
      openSubscriptionDashboard(application!);
    };

    return (
      <>
        <StatusText subscriptionState={subscriptionState} />
        <Button
          className="min-w-20 mt-3 mr-3"
          type="normal"
          label="Manage subscription"
          onClick={manageSubscription}
        />
      </>
    );
  }
);
