import { observer } from 'mobx-react-lite';
import { SubscriptionState } from '../../../../ui_models/app_state/subscription_state';
import { Text } from '@/preferences/components';
import { Button } from '@/components/Button';
import { WebApplication } from '@/ui_models/application';
import { openSubscriptionDashboard } from '@/hooks/manageSubscription';

type Props = {
  subscriptionState: SubscriptionState;
  application?: WebApplication;
};

const StatusText = observer(({ subscriptionState }: Props) => {
  const {
    userSubscriptionName,
    userSubscriptionExpirationDate,
    isUserSubscriptionExpired,
    isUserSubscriptionCanceled,
  } = subscriptionState;
  const expirationDateString = userSubscriptionExpirationDate?.toLocaleString();

  if (isUserSubscriptionCanceled) {
    return (
      <Text className="mt-1">
        Your{' '}
        <span className="font-bold">
          Standard Notes{userSubscriptionName ? ' ' : ''}
          {userSubscriptionName}
        </span>{' '}
        subscription has been canceled{' '}
        {isUserSubscriptionExpired ? (
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

  if (isUserSubscriptionExpired) {
    return (
      <Text className="mt-1">
        Your{' '}
        <span className="font-bold">
          Standard Notes{userSubscriptionName ? ' ' : ''}
          {userSubscriptionName}
        </span>{' '}
        subscription{' '}
        <span className="font-bold">expired on {expirationDateString}</span>.
        You may resubscribe below if you wish.
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
