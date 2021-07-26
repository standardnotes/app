import { FunctionComponent } from 'preact';
import {
  Title,
  Text,
  PreferencesGroup,
  PreferencesSegment,
} from '../../components';
import { Switch } from '../../../components/Switch';
import { observer } from 'mobx-react-lite';
import { TwoFactorAuth } from './model';
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
          checked={auth.enabled !== false}
          onChange={() => auth.toggle2FA()}
        />
      </div>
    </PreferencesSegment>
    <PreferencesSegment>
      {auth.enabled !== false && (
        <TwoFactorEnabledView
          secretKey={auth.enabled.secretKey}
          authCode={auth.enabled.authCode}
        />
      )}

      {auth.activation !== false && (
        <TwoFactorActivationView activation={auth.activation} />
      )}

      {auth.enabled === false && <TwoFactorDisabledView />}
    </PreferencesSegment>
  </PreferencesGroup>
));
