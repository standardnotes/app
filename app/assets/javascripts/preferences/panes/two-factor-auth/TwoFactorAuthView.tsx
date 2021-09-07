import { FunctionComponent } from 'preact';
import {
  Title,
  Text,
  PreferencesGroup,
  PreferencesSegment,
  Subtitle,
} from '../../components';
import { Switch } from '../../../components/Switch';
import { observer } from 'mobx-react-lite';
import {
  is2FAActivation,
  is2FADisabled,
  is2FAEnabled,
  TwoFactorAuth,
} from './TwoFactorAuth';
import { TwoFactorDisabledView } from './TwoFactorDisabledView';
import { TwoFactorActivationView } from './TwoFactorActivationView';

export const TwoFactorAuthView: FunctionComponent<{
  auth: TwoFactorAuth;
}> = observer(({ auth }) => {
  const unavailable = !auth.isMfaFeatureAvailable;
  return (
    <div className="relative">
      <PreferencesGroup className={unavailable ? 'blur-dim-sm' : ''}>
        <PreferencesSegment>
          <div className="flex flex-row items-center">
            <div className="flex-grow flex flex-col">
              <Title>Two-factor authentication</Title>
              <Text>
                An extra layer of security when logging in to your account.
              </Text>
              {auth.errorMessage != null && (
                <Text className="color-danger">{auth.errorMessage}</Text>
              )}
            </div>
            <Switch
              checked={!is2FADisabled(auth.status)}
              onChange={() => auth.toggle2FA()}
            />
          </div>
        </PreferencesSegment>

        {is2FAActivation(auth.status) ? (
          <TwoFactorActivationView activation={auth.status} />
        ) : null}

        {!is2FAEnabled(auth.status) ? (
          <PreferencesSegment>
            <TwoFactorDisabledView />
          </PreferencesSegment>
        ) : null}
      </PreferencesGroup>
      <PreferencesSegment className="bg-default rounded absolute top-1/2 left-1/2 translate-1/2 flex-col py-2 px-4 items-center">
        <Subtitle>Two-factor authentication disabled</Subtitle>
        <Text>Available on a subscription plan.</Text>
      </PreferencesSegment>
    </div>
  );
});
