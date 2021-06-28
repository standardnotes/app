import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';

import { toDirective } from '../components/utils';
import { PreferencesView } from './view';

interface WrapperProps {
  appState: { preferences: { isOpen: boolean; close: () => void } };
}

const PreferencesViewWrapper: FunctionComponent<WrapperProps> = observer(
  ({ appState }) => {
    if (!appState.preferences.isOpen) return null;
    return <PreferencesView close={() => appState.preferences.close()} />;
  }
);

export const PreferencesDirective = toDirective<WrapperProps>(
  PreferencesViewWrapper
);
