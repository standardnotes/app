import { PreferencesGroup, PreferencesSegment } from "@/preferences/components";
import { WebApplication } from "@/ui_models/application";
import { SNComponent } from "@standardnotes/snjs/dist/@types";
import { FunctionComponent } from "preact";
import { PreferencesMenu } from "../PreferencesMenu";
import { ExtensionItem, ExtensionItemProps } from "./extensions-segments";

export const ExtensionPane: FunctionComponent<{
  application: WebApplication, extension: SNComponent, preferencesMenu: PreferencesMenu
}> =
  ({ extension, application, preferencesMenu }) => {
    const url = application.componentManager.urlForComponent(extension) ?? undefined;
    return (
      <PreferencesGroup>
        <ExtensionItem
          application={application}
          extension={extension}
          first={false}
          uninstall={() => application.deleteItem(extension).then(() => preferencesMenu.loadExtensionsPanes())}
          toggleActivate={() => application.toggleComponent(extension).then(() => preferencesMenu.loadExtensionsPanes())}
          latestVersion={ }
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
    );
  };
