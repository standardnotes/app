import { FunctionComponent } from 'preact';
import { observer } from 'mobx-react-lite';
import { WebApplication } from '@/ui_models/application';
import { PreferencesView } from './PreferencesView';

export interface PreferencesWrapperProps {
  appState: { preferences: { isOpen: boolean; closePreferences: () => void } };
  application: WebApplication;
}

export const PreferencesViewWrapper: FunctionComponent<PreferencesWrapperProps> =
  observer(({ appState, application }) => {
    if (!appState.preferences.isOpen) return null;
    return (
      <PreferencesView
        closePreferences={() => appState.preferences.closePreferences()}
        application={application}
        mfaGateway={application}
      />
    );
  });
