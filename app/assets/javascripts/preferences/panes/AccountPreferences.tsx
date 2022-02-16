import {
  Sync,
  Subscription,
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
  ({ application, appState }: Props) => (
    <PreferencesPane>
      {!application.hasAccount() ? (
        <Authentication application={application} appState={appState} />
      ) : (
        <>
          <Credentials application={application} appState={appState} />
          <Sync application={application} />
        </>
      )}
      <Subscription application={application} appState={appState} />
      <SignOutWrapper application={application} appState={appState} />
    </PreferencesPane>
  )
);
