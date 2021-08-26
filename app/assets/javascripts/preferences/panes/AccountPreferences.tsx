import { Sync } from '@/preferences/panes/account';
import { PreferencesPane } from '@/preferences/components';
import { observer } from 'mobx-react-lite';
import { WebApplication } from '@/ui_models/application';

export const AccountPreferences = observer(({application}: {application: WebApplication}) => {
  return (
    <PreferencesPane>
      <Sync application={application} />
    </PreferencesPane>
  );
});