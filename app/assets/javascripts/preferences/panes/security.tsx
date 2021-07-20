import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { PreferencesPane } from '../components';
import { Preferences } from '../models';
import { TwoFactorAuthComponent } from './twoFactorAuth';

export const Security: FunctionComponent<{ prefs: Preferences }> = observer(
  ({ prefs }) => (
    <PreferencesPane>
      <TwoFactorAuthComponent tfAuth={prefs.twoFactorAuth} />
    </PreferencesPane>
  )
);
