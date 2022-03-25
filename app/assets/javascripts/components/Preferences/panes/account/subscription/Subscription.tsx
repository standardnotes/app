import {
  PreferencesGroup,
  PreferencesSegment,
  Title,
} from '@/components/Preferences/components';
import { WebApplication } from '@/ui_models/application';
import { SubscriptionInformation } from './SubscriptionInformation';
import { NoSubscription } from './NoSubscription';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { AppState } from '@/ui_models/app_state';

type Props = {
  application: WebApplication;
  appState: AppState;
};

export const Subscription: FunctionComponent<Props> = observer(
  ({ application, appState }: Props) => {
    const subscriptionState = appState.subscription;
    const { userSubscription } = subscriptionState;

    const now = new Date().getTime();

    return (
      <PreferencesGroup>
        <PreferencesSegment>
          <div className="flex flex-row items-center">
            <div className="flex-grow flex flex-col">
              <Title>Subscription</Title>
              {userSubscription && userSubscription.endsAt > now ? (
                <SubscriptionInformation
                  subscriptionState={subscriptionState}
                  application={application}
                />
              ) : (
                <NoSubscription application={application} />
              )}
            </div>
          </div>
        </PreferencesSegment>
      </PreferencesGroup>
    );
  }
);
