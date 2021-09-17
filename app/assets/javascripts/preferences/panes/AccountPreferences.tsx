import {
  Sync,
  SubscriptionWrapper,
  Credentials,
  LogOutView,
} from '@/preferences/panes/account';
import { PreferencesPane } from '@/preferences/components';
import { observer } from 'mobx-react-lite';
import { WebApplication } from '@/ui_models/application';

type Props = {
  application: WebApplication;
};
export const AccountPreferences = observer(({ application }: Props) => {
  return (
    <PreferencesPane>
      <Credentials application={application} />
      <Sync application={application} />
      <SubscriptionWrapper application={application} />
      <LogOutView application={application} />
    </PreferencesPane>
  );
});
