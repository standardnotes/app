import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { FunctionComponent } from 'preact';
import { PreferencesPane } from '../components';
import { CloudLink, DataBackups, EmailBackups } from './backups-segments';

interface Props {
  appState: AppState;
  application: WebApplication;
}

export const Backups: FunctionComponent<Props> = ({
  application,
  appState,
}) => {
  return (
    <PreferencesPane>
      <DataBackups application={application} appState={appState} />
      <EmailBackups application={application} />
      <CloudLink application={application} />
    </PreferencesPane>
  );
};
