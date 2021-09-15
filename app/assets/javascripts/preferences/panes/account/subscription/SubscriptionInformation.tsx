import { observer } from 'mobx-react-lite';
import { SubscriptionState } from './subscription_state';
import { Text } from '@/preferences/components';
import { Button } from '@/components/Button';

type Props = {
  subscriptionState: SubscriptionState;
};

const StatusText = observer(({ subscriptionState }: Props) => {
  const { userSubscription, userSubscriptionName } = subscriptionState;
  const expirationDate = new Date(userSubscription!.endsAt / 1000).toLocaleString();

  return userSubscription!.cancelled ? (
    <Text>
      Your{' '}
      <span className="font-bold">
        Standard Notes{userSubscriptionName ? ' ' : ''}
        {userSubscriptionName}
      </span>{' '}
      subscription has been{' '}
      <span className="font-bold">
        canceled but will remain valid until{' '}
        {expirationDate}
      </span>
      . You may resubscribe below if you wish.
    </Text>
  ) : (
    <Text>
      Your{' '}
      <span className="font-bold">
        Standard Notes{userSubscriptionName ? ' ' : ''}
        {userSubscriptionName}
      </span>{' '}
      subscription will be{' '}
      <span className="font-bold">
        renewed on {expirationDate}
      </span>
      .
    </Text>
  );
});

const PrimaryButton = observer(({ subscriptionState }: Props) => {
  const { userSubscription } = subscriptionState;

  return (
    <Button
      className="min-w-20 mt-3"
      type="primary"
      label={userSubscription!.cancelled ? "Renew subscription" : "Cancel subscription"}
      onClick={() => null}
    />
  );
});

export const SubscriptionInformation = observer(
  ({ subscriptionState }: Props) => (
    <>
      <StatusText
        subscriptionState={subscriptionState}
      />
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
        <PrimaryButton
          subscriptionState={subscriptionState}
        />
      </div>
    </>
  )
);
