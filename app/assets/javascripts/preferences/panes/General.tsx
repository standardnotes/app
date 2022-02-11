import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { FunctionComponent } from 'preact';
import { PreferencesPane } from '../components';
import { ErrorReporting, Tools, Defaults } from './general-segments';
import { ExtensionsLatestVersions } from '@/preferences/panes/extensions-segments';
import { Advanced } from '@/preferences/panes/account';
import { observer } from 'mobx-react-lite';

interface GeneralProps {
  appState: AppState;
  application: WebApplication;
  extensionsLatestVersions: ExtensionsLatestVersions;
}

export const General: FunctionComponent<GeneralProps> = observer(
  ({ appState, application, extensionsLatestVersions }) => (
    <PreferencesPane>
      <Tools application={application} />
      <Defaults application={application} />
      <ErrorReporting appState={appState} />
      <Advanced
        application={application}
        appState={appState}
        extensionsLatestVersions={extensionsLatestVersions}
      />
    </PreferencesPane>
  )
);
