import { Text } from '../../components';
import { FunctionComponent } from 'preact';

export const TwoFactorDisabledView: FunctionComponent = () => (
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
