import { FunctionComponent } from 'preact';
import {
  Title,
  Text,
  PreferencesGroup,
  PreferencesSegment,
} from '../components';
import { Switch } from '../../components/Switch';
import { observer } from 'mobx-react-lite';
import { DecoratedInput } from '../../components/DecoratedInput';
import { IconButton } from '../../components/IconButton';
import { TwoFactorAuth } from '../models';

// Temporary implementation until integration
function downloadSecretKey(text: string) {
  const link = document.createElement('a');
  const blob = new Blob([text], {
    type: 'text/plain;charset=utf-8',
  });
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', 'secret_key.txt');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(link.href);
}
export const TwoFactorAuthComponent: FunctionComponent<{
  tfAuth: TwoFactorAuth;
}> = observer(({ tfAuth }) => {
  return (
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
            checked={tfAuth.twoFactorStatus === 'enabled'}
            onChange={() => tfAuth.toggle2FA()}
          />
        </div>
      </PreferencesSegment>
      <PreferencesSegment>
        {tfAuth.twoFactorStatus === 'enabled' &&
        tfAuth.twoFactorData != null ? (
          <TwoFactorEnabled tfAuth={tfAuth} />
        ) : (
          <TwoFactorDisabled />
        )}
      </PreferencesSegment>
    </PreferencesGroup>
  );
});

const TwoFactorEnabled: FunctionComponent<{ tfAuth: TwoFactorAuth }> = observer(
  ({ tfAuth }) => {
    const state = tfAuth.twoFactorData!;
    const download = (
      <IconButton
        icon="download"
        onClick={() => {
          downloadSecretKey(state.secretKey);
        }}
      />
    );
    const copy = (
      <IconButton
        icon="copy"
        onClick={() => {
          navigator?.clipboard?.writeText(state.secretKey);
        }}
      />
    );
    const spinner = <div class="sk-spinner info w-8 h-3.5" />;
    return (
      <div className="flex flex-row gap-4">
        <div className="flex-grow flex flex-col">
          <Text>Secret Key</Text>
          <DecoratedInput
            disabled={true}
            right={[copy, download]}
            text={state.secretKey}
          />
        </div>
        <div className="w-30 flex flex-col">
          <Text>Authentication Code</Text>
          <DecoratedInput
            disabled={true}
            text={state.authCode}
            right={[spinner]}
          />
        </div>
      </div>
    );
  }
);
const TwoFactorDisabled: FunctionComponent = () => (
  <Text>
    Enabling two-factor authentication will sign you out of all other sessions.{' '}
    <a
      target="_blank"
      href="https://standardnotes.com/help/21/where-should-i-store-my-two-factor-authentication-secret-key"
    >
      Learn more
    </a>
  </Text>
);
