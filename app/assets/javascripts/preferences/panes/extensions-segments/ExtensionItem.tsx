import { FunctionComponent } from "preact";
import { SNComponent } from "@standardnotes/snjs";

import { PreferencesSegment, Subtitle, Title } from "@/preferences/components";
import { Switch } from "@/components/Switch";
import { WebApplication } from "@/ui_models/application";
import { useEffect, useRef, useState } from "preact/hooks";
import { Button } from "@/components/Button";
import { RenameExtension } from "./RenameExtension";

const ExtensionVersions: FunctionComponent<{
  installedVersion: string,
  latestVersion: string | undefined,
}> = ({ installedVersion, latestVersion }) => {
  return (
    <>
      <Subtitle>Installed version <b>{installedVersion}</b> {latestVersion && <>(latest is <b>{latestVersion}</b>)</>}</Subtitle>
    </>
  );
};

const AutoUpdateLocal: FunctionComponent<{
  autoupdateDisabled: boolean,
  toggleAutoupdate: () => void
}> = ({ autoupdateDisabled, toggleAutoupdate }) => (
  <div className="flex flex-row">
    <Subtitle className="flex-grow">Autoupdate local installation</Subtitle>
    <Switch onChange={toggleAutoupdate} checked={!autoupdateDisabled} />
  </div>
);

const UseHosted: FunctionComponent<{
  offlineOnly: boolean, toggleOfllineOnly: () => void
}> = ({ offlineOnly, toggleOfllineOnly }) => (
  <div className="flex flex-row">
    <Subtitle className="flex-grow">Use hosted when local is unavailable</Subtitle>
    <Switch onChange={toggleOfllineOnly} checked={!offlineOnly} />
  </div>
);

export interface ExtensionItemProps {
  application: WebApplication,
  extension: SNComponent,
  first: boolean,
  latestVersion: string | undefined,
  uninstall: (extension: SNComponent) => void,
  toggleActivate: (extension: SNComponent) => void,
}

export const ExtensionItem: FunctionComponent<ExtensionItemProps> =
  ({ application, extension, first, uninstall, toggleActivate, latestVersion }) => {
    const [autoupdateDisabled, setAutoupdateDisabled] = useState(extension.autoupdateDisabled ?? false);
    const [offlineOnly, setOfflineOnly] = useState(extension.offlineOnly ?? false);
    const [extensionName, setExtensionName] = useState(extension.name);

    const toggleAutoupdate = () => {
      const newAutoupdateValue = !autoupdateDisabled;
      setAutoupdateDisabled(newAutoupdateValue);
      application
        .changeAndSaveItem(extension.uuid, (m: any) => {
          if (m.content == undefined) m.content = {};
          m.content.autoupdateDisabled = newAutoupdateValue;
        })
        .then((item) => {
          const component = (item as SNComponent);
          setAutoupdateDisabled(component.autoupdateDisabled);
        })
        .catch(e => {
          console.error(e);
        });
    };

    const toggleOffllineOnly = () => {
      const newOfflineOnly = !offlineOnly;
      setOfflineOnly(newOfflineOnly);
      application
        .changeAndSaveItem(extension.uuid, (m: any) => {
          if (m.content == undefined) m.content = {};
          m.content.offlineOnly = newOfflineOnly;
        })
        .then((item) => {
          const component = (item as SNComponent);
          setOfflineOnly(component.offlineOnly);
        })
        .catch(e => {
          console.error(e);
        });
    };

    const changeExtensionName = (newName: string) => {
      setExtensionName(newName);
      application
        .changeAndSaveItem(extension.uuid, (m: any) => {
          if (m.content == undefined) m.content = {};
          m.content.name = newName;
        })
        .then((item) => {
          const component = (item as SNComponent);
          setExtensionName(component.name);
        });
    };

    const localInstallable = extension.package_info.download_url;

    const isExternal = !extension.package_info.identifier.startsWith('org.standardnotes.');

    const installedVersion = extension.package_info.version;

    const isEditorOrTags = ['editor-stack', 'tags-list'].includes(extension.area);

    return (
      <PreferencesSegment>
        {first && <>
          <Title>Extensions</Title>
          <div className="w-full min-h-3" />
        </>}

        <RenameExtension extensionName={extensionName} changeName={changeExtensionName} />
        <div className="min-h-2" />

        <ExtensionVersions installedVersion={installedVersion} latestVersion={latestVersion} />

        {localInstallable && <AutoUpdateLocal autoupdateDisabled={autoupdateDisabled} toggleAutoupdate={toggleAutoupdate} />}
        {localInstallable && <UseHosted offlineOnly={offlineOnly} toggleOfllineOnly={toggleOffllineOnly} />}

        {isEditorOrTags || isExternal &&
          <>
            <div className="min-h-2" />
            <div className="flex flex-row">
              {isEditorOrTags && (
                <>
                  {extension.active ?
                    <Button className="min-w-20" type="normal" label="Deactivate" onClick={() => toggleActivate(extension)} /> :
                    <Button className="min-w-20" type="normal" label="Activate" onClick={() => toggleActivate(extension)} />
                  }
                  <div className="min-w-3" />
                </>
              )}
              {isExternal && <Button className="min-w-20" type="normal" label="Uninstall" onClick={() => uninstall(extension)} />}
            </div>
          </>
        }
      </PreferencesSegment >
    );
  };
