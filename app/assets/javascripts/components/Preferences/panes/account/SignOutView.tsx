import { Button } from '@/components/Button';
import { OtherSessionsSignOutContainer } from '@/components/OtherSessionsSignOut';
import {
  PreferencesGroup,
  PreferencesSegment,
  Subtitle,
  Text,
  Title,
} from '@/components/Preferences/components';
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
          <Subtitle>This workspace</Subtitle>
          <Text>
            Remove all data related to the current workspace from the
            application.
          </Text>
          <div className="min-h-3" />
          <Button
            type="danger"
            label="Sign out workspace"
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
    </>
  );
});

const ClearSessionDataView: FunctionComponent<{
  appState: AppState;
}> = observer(({ appState }) => {
  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Clear workspace</Title>
        <Text>
          Remove all data related to the current workspace from the application.
        </Text>
        <div className="min-h-3" />
        <Button
          type="danger"
          label="Clear workspace"
          onClick={() => {
            appState.accountMenu.setSigningOut(true);
          }}
        />
      </PreferencesSegment>
    </PreferencesGroup>
  );
});

export const SignOutWrapper: FunctionComponent<{
  application: WebApplication;
  appState: AppState;
}> = observer(({ application, appState }) => {
  if (!application.hasAccount()) {
    return <ClearSessionDataView appState={appState} />;
  }
  return <SignOutView appState={appState} application={application} />;
});
