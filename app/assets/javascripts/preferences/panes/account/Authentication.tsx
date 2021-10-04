import { AccountMenuPane } from "@/components/AccountMenu";
import { Button } from "@/components/Button";
import { PreferencesGroup, PreferencesSegment, Subtitle, Text, Title } from "@/preferences/components";
import { WebApplication } from "@/ui_models/application";
import { AppState } from "@/ui_models/app_state";
import { observer } from "mobx-react-lite";
import { FunctionComponent } from "preact";

export const Authentication: FunctionComponent<{ application: WebApplication, appState: AppState }> =
  observer(({ appState }) => {

    const clickSignIn = () => {
      appState.preferences.closePreferences();
      appState.accountMenu.setCurrentPane(AccountMenuPane.LogIn);
      appState.accountMenu.setShow(true);
    };

    const clickRegister = () => {
      appState.preferences.closePreferences();
      appState.accountMenu.setCurrentPane(AccountMenuPane.Register);
      appState.accountMenu.setShow(true);
    };

    return (
      <PreferencesGroup>
        <PreferencesSegment>
          <div className="flex flex-col items-center px-12">
            <Title>You're not signed in</Title>
            <Subtitle className="text-center">Sign in to sync your notes and preferences across all your devices and enable end-to-end encryption.</Subtitle>
            <div className="min-h-3" />
            <div className="flex flex-row w-full">
              <Button type="primary" onClick={clickSignIn} label="Sign in" className="flex-grow" />
              <div className="min-w-3" />
              <Button type="primary" onClick={clickRegister} label="Register" className="flex-grow" />
            </div>
            <div className="min-h-3" />
            <Text className="text-center">Standard Notes is free on every platform, and comes standard with sync and encryption.</Text>
          </div>
        </PreferencesSegment>
      </PreferencesGroup>
    );
  });
