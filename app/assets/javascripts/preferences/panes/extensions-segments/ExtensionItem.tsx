import { FunctionComponent } from "preact";
import { SNComponent } from "@standardnotes/snjs";

import { PreferencesSegment, Subtitle, Title, Text } from "@/preferences/components";
import { Switch } from "@/components/Switch";
import { WebApplication } from "@/ui_models/application";
import { useState } from "preact/hooks";
import { Button } from "@/components/Button";
import { DecoratedInput } from "@/components/DecoratedInput";

const ExtensionVersions: FunctionComponent<{
  extension: SNComponent
}> = ({ extension }) => {
  return (
    <div className="flex flex-row">
      <div className="flex flex-col flex-grow">
        <Text>Installed version <b>{extension.package_info.version}</b></Text>
      </div>
    </div>
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

const RenameExtension: FunctionComponent<{
  extensionName: string, changeName: (newName: string) => void
}> = ({ extensionName, changeName }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newExtensionName, setNewExtensionName] = useState<string | undefined>(undefined);

  const startRenaming = () => {
    setNewExtensionName(extensionName);
    setIsRenaming(true);
  };

  const cancelRename = () => {
    setNewExtensionName(undefined);
    setIsRenaming(false);
  };

  const confirmRename = () => {
    if (newExtensionName == undefined || newExtensionName === '') {
      return;
    }
    changeName(newExtensionName);
    setNewExtensionName(undefined);
    setIsRenaming(false);
  };

  if (!isRenaming) {
    return (
      <Button type="normal" label="Rename" onClick={startRenaming} />
    );
  }

  return <DecoratedInput
    autoFocus={true}
    text={newExtensionName}
    onChange={(text) => setNewExtensionName(text)}
    right={[
      <a className="cursor-pointer" onClick={confirmRename}>Confirm</a>,
      <a className="cursor-pointer" onClick={cancelRename}>Cancel</a>
    ]} />;
};

export const ExtensionItem: FunctionComponent<{
  application: WebApplication,
  extension: SNComponent,
  first: boolean,
  uninstall: (extension: SNComponent) => void,
  toggleActivate: (extension: SNComponent) => void,
}> = ({ application, extension, first, uninstall, toggleActivate }) => {
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

  const isEditorOrTags = ['editor-stack', 'tags-list'].includes(extension.area);

  return (
    <PreferencesSegment>
      {first && <>
        <Title>Extensions</Title>
        <div className="w-full min-h-3" />
      </>}

      <Title>{extensionName}</Title>
      <ExtensionVersions extension={extension} />

      <div className="min-h-2" />
      <RenameExtension extensionName={extensionName} changeName={changeExtensionName} />
      <div className="min-h-2" />

      {localInstallable && <AutoUpdateLocal autoupdateDisabled={autoupdateDisabled} toggleAutoupdate={toggleAutoupdate} />}
      {localInstallable && <UseHosted offlineOnly={offlineOnly} toggleOfllineOnly={toggleOffllineOnly} />}

      <div className="flex flex-row">
        {isEditorOrTags && (
          <>
            {extension.active ?
              <Button type="normal" label="Deactivate" onClick={() => toggleActivate(extension)} /> :
              <Button type="primary" label="Activate" onClick={() => toggleActivate(extension)} />
            }
            <div className="min-w-3" />
          </>
        )}
        {isExternal && <Button type="danger" label="Uninstall" onClick={() => uninstall(extension)} />}
      </div>
    </PreferencesSegment>
  );
};
