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
import { GetSubscriptionResponse } from '@standardnotes/snjs/dist/@types/services/api/responses';

type Props = {
  application: WebApplication;
};

enum PlanName {
  CorePlan = 'CORE_PLAN',
  PlusPlan = 'PLUS_PLAN',
  ProPlan = 'PRO_PLAN',
}

type Subscription = {
  cancelled: boolean;
  planName: PlanName;
  endsAt: number;
};

type SubscriptionInformationProps = {
  subscription?: Subscription;
};

type ValidSubscriptionProps = {
  subscription: Subscription;
};

const mapPlanNameToString = (planName: PlanName) => {
  switch (planName) {
    case 'CORE_PLAN':
      return 'Core';
    case 'PLUS_PLAN':
      return 'Plus';
    case 'PRO_PLAN':
      return 'Pro';
    default:
      return '';
  }
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

const ActiveSubscription = ({ subscription }: ValidSubscriptionProps) => (
  <>
    <Text>
      Your{' '}
      <span className="font-bold">
        Standard Notes {mapPlanNameToString(subscription.planName)}
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

const CancelledSubscription = ({ subscription }: ValidSubscriptionProps) => (
  <>
    <Text>
      Your{' '}
      <span className="font-bold">
        Standard Notes {mapPlanNameToString(subscription.planName)}
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
}: SubscriptionInformationProps) => {
  const now = new Date().getTime();
  if (subscription && subscription.endsAt > now) {
    return subscription.cancelled ? (
      <CancelledSubscription subscription={subscription} />
    ) : (
      <ActiveSubscription subscription={subscription} />
    );
  }
  return <NoSubscription />;
};

const Subscription = observer(({ application }: Props) => {
  const [subscription, setSubscription] =
    useState<Subscription | undefined>(undefined);

  useEffect(() => {
    const getSubscription = async () => {
      const result = await application.getUserSubscription();
      if (!result.error && result.data) {
        const data = (result as GetSubscriptionResponse).data;
        const subscription = data!.subscription;
        setSubscription(subscription);
      }
    };
    getSubscription();
  }, [application]);

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex flex-row items-center">
          <div className="flex-grow flex flex-col">
            <Title>Subscription</Title>
            <SubscriptionInformation subscription={subscription} />
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
});

export default Subscription;
