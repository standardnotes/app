import { PreferencesGroup, PreferencesSegment } from '@/preferences/components';
import { WebApplication } from '@/ui_models/application';
import { ComponentViewer, SNComponent } from '@standardnotes/snjs';
import { FeatureIdentifier } from '@standardnotes/features';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { ExtensionItem } from './extensions-segments';
import { ComponentView } from '@/components/ComponentView';
import { AppState } from '@/ui_models/app_state';
import { PreferencesMenu } from '@/preferences/PreferencesMenu';
import { useEffect, useState } from 'preact/hooks';

interface IProps {
  application: WebApplication;
  appState: AppState;
  extension: SNComponent;
  preferencesMenu: PreferencesMenu;
}

const urlOverrideForExtension = (extension: SNComponent) => {
  if (extension.identifier === FeatureIdentifier.CloudLink) {
    return 'https://extensions.standardnotes.org/components/cloudlink';
  } else {
    return undefined;
  }
};

export const ExtensionPane: FunctionComponent<IProps> = observer(
  ({ extension, application, appState, preferencesMenu }) => {
    const [componentViewer] = useState<ComponentViewer>(
      application.componentManager.createComponentViewer(
        extension,
        undefined,
        undefined,
        urlOverrideForExtension(extension)
      )
    );
    const latestVersion =
      preferencesMenu.extensionsLatestVersions.getVersion(extension);

    useEffect(() => {
      return () => {
        application.componentManager.destroyComponentViewer(componentViewer);
      };
    }, [application, componentViewer]);

    return (
      <div className="preferences-extension-pane color-foreground flex-grow flex flex-row overflow-y-auto min-h-0">
        <div className="flex-grow flex flex-col py-6 items-center">
          <div className="w-200 max-w-200 flex flex-col">
            <PreferencesGroup>
              <ExtensionItem
                application={application}
                extension={extension}
                first={false}
                uninstall={() =>
                  application
                    .deleteItem(extension)
                    .then(() => preferencesMenu.loadExtensionsPanes())
                }
                latestVersion={latestVersion}
              />
              <PreferencesSegment>
                <ComponentView
                  application={application}
                  appState={appState}
                  componentViewer={componentViewer}
                />
              </PreferencesSegment>
            </PreferencesGroup>
          </div>
        </div>
      </div>
    );
  }
);
