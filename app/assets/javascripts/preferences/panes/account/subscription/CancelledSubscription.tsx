import { observer } from 'mobx-react-lite';
import { SubscriptionState } from './subscription_state';
import { Text } from '@/preferences/components';
import { Button } from '@/components/Button';

type Props = {
  subscriptionState: SubscriptionState;
};

export const CancelledSubscription = observer(
  ({ subscriptionState }: Props) => {
    const { userSubscription, userSubscriptionName } = subscriptionState;
    return (
      <>
        <Text>
          Your{' '}
          <span className="font-bold">
            Standard Notes{userSubscriptionName ? " " : ""}{userSubscriptionName}
          </span>{' '}
          subscription has been{' '}
          <span className="font-bold">
            canceled but will remain valid until{' '}
            {new Date(userSubscription!.endsAt).toLocaleString()}
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
  }
);
