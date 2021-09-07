import { observer } from 'mobx-react-lite';
import { SubscriptionState } from './subscription_state';
import { Text } from '@/preferences/components';
import { Button } from '@/components/Button';

type Props = {
  subscriptionState: SubscriptionState;
};

export const ActiveSubscription = observer(
  ({ subscriptionState }: Props) => {
    const { userSubscription, userSubscriptionName } = subscriptionState;
    return (
      <>
        <Text>
          Your{' '}
          <span className="font-bold">
            Standard Notes{userSubscriptionName ? " " : ""}{userSubscriptionName}
          </span>{' '}
          subscription will be{' '}
          <span className="font-bold">
            renewed on {new Date(userSubscription!.endsAt).toLocaleString()}
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
  }
);
