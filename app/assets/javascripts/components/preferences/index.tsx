import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';

import { toDirective } from '../utils';
import { PreferencesView } from './view';

interface WrapperProps {
  appState: { preferences: { isOpen: boolean; closePreferences: () => void } };
}

const PreferencesViewWrapper: FunctionComponent<WrapperProps> = observer(
  ({ appState }) => {
    if (!appState.preferences.isOpen) return null;
    return (
      <PreferencesView close={() => appState.preferences.closePreferences()} />
    );
  }
);

export const PreferencesDirective = toDirective<WrapperProps>(
  PreferencesViewWrapper
);
