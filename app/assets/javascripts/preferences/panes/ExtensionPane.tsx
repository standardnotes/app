import { PreferencesGroup, PreferencesSegment } from "@/preferences/components";
import { WebApplication } from "@/ui_models/application";
import { SNComponent } from "@standardnotes/snjs/dist/@types";
import { observer } from "mobx-react-lite";
import { FunctionComponent } from "preact";
import { Preferences } from "../Preferences";
import { ExtensionItem } from "./extensions-segments";

export const ExtensionPane: FunctionComponent<{
  application: WebApplication, extension: SNComponent, preferencesMenu: Preferences
}> = observer(
  ({ extension, application, preferencesMenu }) => {
    const url = application.componentManager.urlForComponent(extension) ?? undefined;
    const latestVersion = preferencesMenu.extensionsLatestVersions.getVersion(extension);
    return (
      <div className="color-foreground flex-grow flex flex-row overflow-y-auto min-h-0">
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
                <iframe
                  data-component-id={extension.uuid}
                  frameBorder="0"
                  sandbox="allow-scripts allow-top-navigation-by-user-activation allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-modals allow-forms allow-downloads"
                  src={url}
                />
              </PreferencesSegment>
            </PreferencesGroup>
          </div>
        </div>
      </div>
    );
  });
