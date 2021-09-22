import PasscodeLock from "@/components/AccountMenu/PasscodeLock";
import { Button } from "@/components/Button";
import { Switch } from "@/components/Switch";
import { WebApplication } from "@/ui_models/application";
import { AppState } from "@/ui_models/app_state";
import { FunctionComponent } from "preact";
import { PreferencesGroup, PreferencesSegment, Title, Text } from "../../components";

const someText = "Use a passcode instead of your password to access locked items. You will still need your password when logging in and adjusting account or security settings. Your passcode will not work on other devies.";

export const PasscodeLockWrapper: FunctionComponent<{ application: WebApplication, appState: AppState }> = ({ application, appState }) => {
  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <PasscodeLock appState={appState} application={application} />
      </PreferencesSegment>
    </PreferencesGroup>
  );
};

// const PasscodeLock: FunctionComponent = () => {
//   return (
//     <PreferencesGroup>
//       <PreferencesSegment>
//         <Title>Passcode lock</Title>
//         <div className="flex flex-row">
//           <Text>{someText}</Text>
//           <Switch checked={true} onChange={() => console.log('hello')} />
//         </div>
//         <div className="min-h-4" />
//         <Button type="normal" label="Change passcode" onClick={() => console.log('hello')} />
//       </PreferencesSegment>
//     </PreferencesGroup>
//   );
// };
