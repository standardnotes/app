import { Button } from '@/components/Button';
import { ConfirmSignoutContainer } from '@/components/ConfirmSignoutModal';
import { OtherSessionsSignOutContainer } from '@/components/OtherSessionsSignOut';
import {
  PreferencesGroup,
  PreferencesSegment,
  Subtitle,
  Text,
  Title,
} from '@/preferences/components';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';

const SignOutView: FunctionComponent<{
  application: WebApplication;
  appState: AppState;
}> = observer(({ application, appState }) => {
  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Sign out</Title>
          <Subtitle>Other devices</Subtitle>
          <Text>Want to sign out on all devices except this one?</Text>
          <div className="min-h-3" />
          <div className="flex flex-row">
            <Button
              className="mr-3"
              type="normal"
              label="Sign out other sessions"
              onClick={() => {
                appState.accountMenu.setOtherSessionsSignOut(true);
              }}
            />
            <Button
              type="normal"
              label="Manage sessions"
              onClick={() => appState.openSessionsModal()}
            />
          </div>
        </PreferencesSegment>
        <PreferencesSegment>
          <Subtitle>This device</Subtitle>
          <Text>This will delete all local items and preferences.</Text>
          <div className="min-h-3" />
          <Button
            type="danger"
            label="Sign out and clear local data"
            onClick={() => {
              appState.accountMenu.setSigningOut(true);
            }}
          />
        </PreferencesSegment>
      </PreferencesGroup>
      <OtherSessionsSignOutContainer
        appState={appState}
        application={application}
      />

      <ConfirmSignoutContainer appState={appState} application={application} />
    </>
  );
});

const ClearSessionDataView: FunctionComponent<{
  application: WebApplication;
  appState: AppState;
}> = observer(({ application, appState }) => {
  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Clear session data</Title>
          <Text>This will delete all local items and preferences.</Text>
          <div className="min-h-3" />
          <Button
            type="danger"
            label="Clear Session Data"
            onClick={() => {
              appState.accountMenu.setSigningOut(true);
            }}
          />
        </PreferencesSegment>
      </PreferencesGroup>

      <ConfirmSignoutContainer appState={appState} application={application} />
    </>
  );
});

export const SignOutWrapper: FunctionComponent<{
  application: WebApplication;
  appState: AppState;
}> = observer(({ application, appState }) => {
  if (!application.hasAccount())
    return (
      <ClearSessionDataView appState={appState} application={application} />
    );
  return <SignOutView appState={appState} application={application} />;
});
