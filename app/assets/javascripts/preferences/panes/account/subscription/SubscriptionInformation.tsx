import { observer } from 'mobx-react-lite';
import { SubscriptionState } from './subscription_state';
import { Text } from '@/preferences/components';
import { Button } from '@/components/Button';
import { WebApplication } from '@/ui_models/application';

type Props = {
  subscriptionState: SubscriptionState;
  application?: WebApplication;
};

const StatusText = observer(({ subscriptionState }: Props) => {
  const { userSubscription, userSubscriptionName } = subscriptionState;
  const expirationDate = new Date(
    userSubscription!.endsAt / 1000
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

const PrimaryButton = observer(({ subscriptionState }: Props) => {
  const { userSubscription } = subscriptionState;

  return (
    <Button
      className="min-w-20 mt-3"
      type="primary"
      label={
        userSubscription!.cancelled
          ? 'Renew subscription'
          : 'Cancel subscription'
      }
      onClick={() => null}
    />
  );
});

export const SubscriptionInformation = observer(
  ({ subscriptionState, application }: Props) => {
    const openSubscriptionDashboard = async () => {
      const token = await application?.getNewSubscriptionToken();
      if (!token) {
        return;
      }
      window.location.assign(
        `${window._dashboard_url}?subscription_token=${token}`
      );
    };

    return (
      <>
        <StatusText subscriptionState={subscriptionState} />
        <div className="flex flex-wrap">
          <Button
            className="min-w-20 mt-3 mr-3"
            type="normal"
            label="Manage subscription"
            onClick={openSubscriptionDashboard}
          />
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
          <PrimaryButton subscriptionState={subscriptionState} />
        </div>
      </>
    );
  }
);
