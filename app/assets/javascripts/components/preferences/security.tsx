import { FunctionalComponent } from 'preact';
import { PreferencesGroup, PreferencesPane, PreferencesSegment } from './pane';
import { Title, Subtitle, Text, Button } from './content';

const TwoFactorAuthentication: FunctionalComponent = () => (
  <PreferencesGroup>
    <PreferencesSegment>
      <Title>Two-factor authentication</Title>
      <Text>An extra layer of security when logging in to your account.</Text>
    </PreferencesSegment>
    <PreferencesSegment>
      <Text>
        Enabling two-factor authentication will sign you out of all other
        sessions.{' '}
        <a
          target="_blank"
          href="https://standardnotes.com/help/21/where-should-i-store-my-two-factor-authentication-secret-key"
        >
          Learn more
        </a>
      </Text>
    </PreferencesSegment>
  </PreferencesGroup>
);

export const Security: FunctionalComponent = () => (
  <PreferencesPane>
    <TwoFactorAuthentication />
  </PreferencesPane>
);
