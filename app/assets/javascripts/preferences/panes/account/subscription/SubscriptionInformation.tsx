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
  ).toLocaleString();

  return userSubscription!.cancelled ? (
    <Text className="mt-1">
      Your{' '}
      <span className="font-bold">
        Standard Notes{userSubscriptionName ? ' ' : ''}
        {userSubscriptionName}
      </span>{' '}
      subscription has been{' '}
      <span className="font-bold">
        canceled but will remain valid until {expirationDate}
      </span>
      . You may resubscribe below if you wish.
    </Text>
  ) : (
    <Text className="mt-1">
      Your{' '}
      <span className="font-bold">
        Standard Notes{userSubscriptionName ? ' ' : ''}
        {userSubscriptionName}
      </span>{' '}
      subscription will be{' '}
      <span className="font-bold">renewed on {expirationDate}</span>.
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
