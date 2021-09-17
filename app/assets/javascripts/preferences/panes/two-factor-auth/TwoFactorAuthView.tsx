import { FunctionComponent } from 'preact';
import {
  Title,
  Text,
  PreferencesGroup,
  PreferencesSegment,
  LinkButton,
} from '../../components';
import { Switch } from '../../../components/Switch';
import { observer } from 'mobx-react-lite';
import { is2FAActivation, is2FADisabled, TwoFactorAuth } from './TwoFactorAuth';
import { TwoFactorActivationView } from './TwoFactorActivationView';

const TwoFactorTitle: FunctionComponent<{ auth: TwoFactorAuth }> = observer(
  ({ auth }) => {
    if (!auth.isLoggedIn()) {
      return <Title>Two-factor authentication not available</Title>;
    }
    if (!auth.isMfaFeatureAvailable()) {
      return <Title>Two-factor authentication not available</Title>;
    }
    return <Title>Two-factor authentication</Title>;
  }
);

const TwoFactorDescription: FunctionComponent<{ auth: TwoFactorAuth }> =
  observer(({ auth }) => {
    if (!auth.isLoggedIn()) {
      return <Text>Sign in or register for an account to configure 2FA.</Text>;
    }
    if (!auth.isMfaFeatureAvailable()) {
      return (
        <Text>
          A paid subscription plan is required to enable 2FA.{' '}
          <a target="_blank" href="https://standardnotes.com/features">
            Learn more
          </a>
          .
        </Text>
      );
    }
    return (
      <Text>An extra layer of security when logging in to your account.</Text>
    );
  });

const TwoFactorSwitch: FunctionComponent<{ auth: TwoFactorAuth }> = observer(
  ({ auth }) => {
    if (auth.isLoggedIn() && auth.isMfaFeatureAvailable()) {
      return (
        <Switch
          checked={!is2FADisabled(auth.status)}
          onChange={auth.toggle2FA}
        />
      );
    }
    return null;
  }
);

export const TwoFactorAuthView: FunctionComponent<{
  auth: TwoFactorAuth;
}> = observer(({ auth }) => {
  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <div className="flex flex-row items-center">
            <div className="flex-grow flex flex-col">
              <TwoFactorTitle auth={auth} />
              <TwoFactorDescription auth={auth} />
            </div>
            <TwoFactorSwitch auth={auth} />
          </div>
        </PreferencesSegment>

        {auth.errorMessage != null && (
          <PreferencesSegment>
            <Text className="color-danger">{auth.errorMessage}</Text>
          </PreferencesSegment>
        )}
      </PreferencesGroup>
      {is2FAActivation(auth.status) && (
        <TwoFactorActivationView activation={auth.status} />
      )}
    </>
  );
});
