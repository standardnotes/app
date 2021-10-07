import { FunctionComponent } from "preact";
import { SNComponent } from "@standardnotes/snjs";

import { PreferencesSegment, Subtitle, Title } from "@/preferences/components";
import { Switch } from "@/components/Switch";
import { WebApplication } from "@/ui_models/application";
import { useEffect, useRef, useState } from "preact/hooks";
import { Button } from "@/components/Button";

const ExtensionVersions: FunctionComponent<{
  extension: SNComponent
}> = ({ extension }) => {
  return (
    <div className="flex flex-row">
      <div className="flex flex-col flex-grow">
        <Subtitle>Installed version <b>{extension.package_info.version}</b></Subtitle>
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
  const [newExtensionName, setNewExtensionName] = useState<string>(extensionName);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current.focus();
    }
  }, [inputRef, isRenaming]);

  const startRenaming = () => {
    setNewExtensionName(extensionName);
    setIsRenaming(true);
  };

  const cancelRename = () => {
    setNewExtensionName(extensionName);
    setIsRenaming(false);
  };

  const confirmRename = () => {
    if (newExtensionName == undefined || newExtensionName === '') {
      return;
    }
    changeName(newExtensionName);
    setIsRenaming(false);
  };

  return (
    <div className="flex flex-row mr-3 items-center">
      <input
        ref={inputRef}
        disabled={!isRenaming}
        autocomplete='off'
        className="flex-grow text-base font-bold no-border bg-default px-0 color-text"
        type="text"
        value={newExtensionName}
        onChange={({ target: input }) => setNewExtensionName((input as HTMLInputElement)?.value)}
      />
      <div className="min-w-3" />
      {isRenaming ?
        <>
          <a className="pt-1 cursor-pointer" onClick={confirmRename}>Confirm</a>
          <div className="min-w-3" />
          <a className="pt-1 cursor-pointer" onClick={cancelRename}>Cancel</a>
        </> :
        <a className="pt-1 cursor-pointer" onClick={startRenaming}>Rename</a>
      }
    </div>
  );
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

      <RenameExtension extensionName={extensionName} changeName={changeExtensionName} />
      <div className="min-h-2" />

      <ExtensionVersions extension={extension} />

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
