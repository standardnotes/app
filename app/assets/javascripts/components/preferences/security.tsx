import { FunctionalComponent } from 'preact';
import { PreferencesPane } from './pane';
import { TwoFactorAuthentication } from './two-factor-auth';

export const Security: FunctionalComponent = () => (
  <PreferencesPane>
    <TwoFactorAuthentication />
  </PreferencesPane>
);
