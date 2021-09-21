import { Button } from '@/components/Button';
import { ConfirmSignoutContainer } from '@/components/ConfirmSignoutModal';
import { OtherSessionsLogoutContainer } from '@/components/OtherSessionsLogout';
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

const LogOutView: FunctionComponent<{
  application: WebApplication;
  appState: AppState;
}> = observer(({ application, appState }) => {

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Log out</Title>
          <div className="min-h-2" />
          <Subtitle>Other devices</Subtitle>
          <Text>Want to log out on all devices except this one?</Text>
          <div className="min-h-3" />
          <div className="flex flex-row">
            <Button
              className="mr-3"
              type="normal"
              label="Log out other sessions"
              onClick={() => {
                appState.accountMenu.setOtherSessionsLogout(true);
              }}
            />
            <Button type="normal" label="Manage sessions" onClick={() => appState.openSessionsModal()} />
          </div>
        </PreferencesSegment>
        <PreferencesSegment>
          <Subtitle>This device</Subtitle>
          <Text>This will delete all local items and preferences.</Text>
          <div className="min-h-3" />
          <Button
            type="danger"
            label="Log out and clear local data"
            onClick={() => {
              appState.accountMenu.setSigningOut(true);
            }}
          />
        </PreferencesSegment>
      </PreferencesGroup>
      <OtherSessionsLogoutContainer appState={appState} application={application} />

      <ConfirmSignoutContainer
        appState={appState}
        application={application}
      />

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
          <Title>Clear Session Data</Title>
          <div className="min-h-2" />
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

      <ConfirmSignoutContainer
        appState={appState}
        application={application}
      />

    </>);
});

export const LogOutWrapper: FunctionComponent<{
  application: WebApplication;
  appState: AppState;
}> = observer(({ application, appState }) => {
  const isLoggedIn = application.getUser() != undefined;
  if (!isLoggedIn) return <ClearSessionDataView appState={appState} application={application} />;
  return <LogOutView appState={appState} application={application} />;
});
