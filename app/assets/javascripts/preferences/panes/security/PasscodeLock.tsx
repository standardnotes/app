import PasscodeLock from "@/components/AccountMenu/PasscodeLock";
import { WebApplication } from "@/ui_models/application";
import { AppState } from "@/ui_models/app_state";
import { FunctionComponent } from "preact";
import { PreferencesGroup } from "../../components";

export const PasscodeLockWrapper: FunctionComponent<{ application: WebApplication, appState: AppState }> = ({ application, appState }) => {
  return (
    <PreferencesGroup>
      <PasscodeLock appState={appState} application={application} />
    </PreferencesGroup>
  );
};
