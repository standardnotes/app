import { FunctionComponent } from 'preact';
import {
  Title,
  Text,
  PreferencesGroup,
  PreferencesSegment,
} from '../../components';
import { Switch } from '../../../components/Switch';
import { observer } from 'mobx-react-lite';
import {
  is2FAActivation,
  is2FADisabled,
  is2FAEnabled,
  TwoFactorAuth,
} from './model';
import { TwoFactorDisabledView } from './TwoFactorDisabledView';
import { TwoFactorEnabledView } from './TwoFactorEnabledView';
import { TwoFactorActivationView } from './TwoFactorActivationView';

export const TwoFactorAuthView: FunctionComponent<{
  auth: TwoFactorAuth;
}> = observer(({ auth }) => (
  <PreferencesGroup>
    <PreferencesSegment>
      <div className="flex flex-row items-center">
        <div className="flex-grow flex flex-col">
          <Title>Two-factor authentication</Title>
          <Text>
            An extra layer of security when logging in to your account.
          </Text>
        </div>
        <Switch
          checked={!is2FADisabled(auth.status)}
          onChange={() => auth.toggle2FA()}
        />
      </div>
    </PreferencesSegment>
    <PreferencesSegment>
      {is2FAEnabled(auth.status) && (
        <TwoFactorEnabledView
          secretKey={auth.status.secretKey}
          authCode={auth.status.authCode}
        />
      )}

      {is2FAActivation(auth.status) && (
        <TwoFactorActivationView activation={auth.status} />
      )}

      {!is2FAEnabled(auth.status) && <TwoFactorDisabledView />}
    </PreferencesSegment>
  </PreferencesGroup>
));
