import { FunctionComponent } from 'preact';
import { observer } from 'mobx-react-lite';
import { WebApplication } from '@/ui_models/application';
import { PreferencesView } from './PreferencesView';
import { AppState } from '@/ui_models/app_state';

export interface PreferencesViewWrapperProps {
  appState: AppState;
  application: WebApplication;
}

export const PreferencesViewWrapper: FunctionComponent<PreferencesViewWrapperProps> =
  observer(({ appState, application }) => {
    if (!appState.preferences.isOpen) {
      return null;
    }

    return (
      <PreferencesView
        closePreferences={() => appState.preferences.closePreferences()}
        application={application}
        appState={appState}
        mfaProvider={application}
        userProvider={application}
      />
    );
  });
