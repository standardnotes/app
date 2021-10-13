import {
  Sync,
  SubscriptionWrapper,
  Credentials,
  SignOutWrapper,
  Authentication,
} from '@/preferences/panes/account';
import { PreferencesPane } from '@/preferences/components';
import { observer } from 'mobx-react-lite';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';

type Props = {
  application: WebApplication;
  appState: AppState;
};

export const AccountPreferences = observer(
  ({ application, appState }: Props) => {

    if (!application.hasAccount()) {
      return (
        <PreferencesPane>
          <Authentication application={application} appState={appState} />
          {appState.enableUnfinishedFeatures && <SubscriptionWrapper application={application} />}
          <SignOutWrapper application={application} appState={appState} />
        </PreferencesPane>
      );
    }

    return (
      <PreferencesPane>
        <Credentials application={application} />
        <Sync application={application} />
        {appState.enableUnfinishedFeatures && <SubscriptionWrapper application={application} />}
        <SignOutWrapper application={application} appState={appState} />
      </PreferencesPane>
    );
  }
);
