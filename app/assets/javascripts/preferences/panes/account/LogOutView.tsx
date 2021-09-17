import { Button } from '@/components/Button';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import {
  PreferencesGroup,
  PreferencesSegment,
  Subtitle,
  Text,
  Title,
} from '@/preferences/components';
import { WebApplication } from '@/ui_models/application';
import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';

const OtherSessionsLogoutDialog: FunctionComponent<{
  logout: () => Promise<void>;
  closeDialog: () => void;
}> = ({ logout, closeDialog }) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  return (
    <ConfirmationDialog title={<Title>End other sessions?</Title>}>
      <Text>
        The associated app will be signed out and all data removed from the
        device when it is next launched. You can sign back in on that device at
        any time.
      </Text>
      <div className="min-h-6" />
      <div className="flex flex-row items-center w-full">
        <Button
          type="normal"
          label="Cancel"
          onClick={() => {
            closeDialog();
          }}
          className="flex-grow"
        />

        <div className="min-w-3" />
        <Button
          type="danger"
          label="Log out"
          onClick={() => {
            logout()
              .then(() => closeDialog())
              .catch((e: Error) => setErrorMessage(e.message));
          }}
          className="flex-grow"
        />
      </div>
      {errorMessage !== undefined && (
        <>
          <div className="min-h-3" />
          <Text className="color-danger">{errorMessage}</Text>
        </>
      )}
    </ConfirmationDialog>
  );
};

const CurrentSessionLogoutDialog: FunctionComponent<{
  logout: () => Promise<void>;
  closeDialog: () => void;
}> = ({ logout, closeDialog }) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  return (
    <ConfirmationDialog title={<Title>End your session?</Title>}>
      <Text>This will delete all your local items and preferences.</Text>
      <div className="min-h-6" />
      <div className="flex flex-row items-center w-full">
        <Button
          type="normal"
          label="Cancel"
          onClick={() => {
            closeDialog();
          }}
          className="flex-grow"
        />

        <div className="min-w-3" />
        <Button
          type="danger"
          label="Log out"
          onClick={() => {
            logout()
              .then(() => closeDialog())
              .catch((e: Error) => setErrorMessage(e.message));
          }}
          className="flex-grow"
        />
      </div>
      {errorMessage != undefined && (
        <>
          <div className="min-h-3" />
          <Text className="color-danger">{errorMessage}</Text>
        </>
      )}
    </ConfirmationDialog>
  );
};

export const LogOutView: FunctionComponent<{ application: WebApplication }> = ({
  application: app,
}) => {
  const [showCurrentLogout, setShowCurrentLogout] = useState(false);
  const [showOtherLogout, setShowOtherLogout] = useState(false);

  const isLoggedIn = app.getUser() != undefined;
  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Log out</Title>
          <div className="min-h-2" />
          <Subtitle>Other devices</Subtitle>
          <Text>Want to log out on all devices except this one?</Text>
          <div className="min-h-3" />
          <Button
            type="normal"
            label="Log out other sessions"
            onClick={() => {
              setShowOtherLogout(true);
            }}
          />
        </PreferencesSegment>
        <PreferencesSegment>
          <Subtitle>This device</Subtitle>
          <Text>This will delete all local items and preferences.</Text>
          <div className="min-h-3" />
          <Button
            type="danger"
            label="Log out and clear local data"
            onClick={() => {
              setShowCurrentLogout(true);
            }}
          />
        </PreferencesSegment>
      </PreferencesGroup>
      {showCurrentLogout && (
        <CurrentSessionLogoutDialog
          closeDialog={() => setShowCurrentLogout(false)}
          logout={() => app.signOut()}
        />
      )}
      {showOtherLogout && (
        <OtherSessionsLogoutDialog
          closeDialog={() => setShowOtherLogout(false)}
          logout={() => app.revokeAllOtherSessions()}
        />
      )}
    </>
  );
};
