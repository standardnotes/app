import { PreferencesGroup, PreferencesSegment } from "@/preferences/components";
import { WebApplication } from "@/ui_models/application";
import { SNComponent } from "@standardnotes/snjs/dist/@types";
import { observer } from "mobx-react-lite";
import { FunctionComponent } from "preact";
import { Preferences } from "../Preferences";
import { ExtensionItem } from "./extensions-segments";
import { ComponentView } from '@/components/ComponentView';
import { AppState } from '@/ui_models/app_state';

interface IProps {
  application: WebApplication;
  appState: AppState;
  extension: SNComponent;
  preferencesMenu: Preferences;
}
// TODO: why do we call this component `ExtensionPane`, what it has in common with Extensions?
export const ExtensionPane: FunctionComponent<IProps> = observer(
  ({ extension, application, appState, preferencesMenu }) => {
    const latestVersion = preferencesMenu.extensionsLatestVersions.getVersion(extension);

    return (
      <div className="preferences-extension-pane color-foreground flex-grow flex flex-row overflow-y-auto min-h-0">
        <div className="flex-grow flex flex-col py-6 items-center">
          <div className="w-200 max-w-200 flex flex-col">
            <PreferencesGroup>
              <ExtensionItem
                application={application}
                extension={extension}
                first={false}
                uninstall={() => application.deleteItem(extension).then(() => preferencesMenu.loadExtensionsPanes())}
                toggleActivate={() => application.toggleComponent(extension).then(() => preferencesMenu.loadExtensionsPanes())}
                latestVersion={latestVersion}
              />
              <PreferencesSegment>
                <ComponentView
                  application={application}
                  appState={appState}
                  componentUuid={extension.uuid}
                />
              </PreferencesSegment>
            </PreferencesGroup>
          </div>
        </div>
      </div>
    );
  });
