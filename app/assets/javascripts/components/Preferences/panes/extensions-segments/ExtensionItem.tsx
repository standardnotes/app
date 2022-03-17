import { FunctionComponent } from 'preact';
import { SNComponent } from '@standardnotes/snjs';
import {
  PreferencesSegment,
  SubtitleLight,
  Title,
} from '@/components/Preferences/components';
import { Switch } from '@/components/Switch';
import { WebApplication } from '@/ui_models/application';
import { useState } from 'preact/hooks';
import { Button } from '@/components/Button';
import { RenameExtension } from './RenameExtension';

const UseHosted: FunctionComponent<{
  offlineOnly: boolean;
  toggleOfllineOnly: () => void;
}> = ({ offlineOnly, toggleOfllineOnly }) => (
  <div className="flex flex-row">
    <SubtitleLight className="flex-grow">
      Use hosted when local is unavailable
    </SubtitleLight>
    <Switch onChange={toggleOfllineOnly} checked={!offlineOnly} />
  </div>
);

export interface ExtensionItemProps {
  application: WebApplication;
  extension: SNComponent;
  first: boolean;
  latestVersion: string | undefined;
  uninstall: (extension: SNComponent) => void;
  toggleActivate?: (extension: SNComponent) => void;
}

export const ExtensionItem: FunctionComponent<ExtensionItemProps> = ({
  application,
  extension,
  first,
  uninstall,
}) => {
  const [offlineOnly, setOfflineOnly] = useState(
    extension.offlineOnly ?? false
  );
  const [extensionName, setExtensionName] = useState(extension.name);

  const toggleOffllineOnly = () => {
    const newOfflineOnly = !offlineOnly;
    setOfflineOnly(newOfflineOnly);
    application
      .changeAndSaveItem(extension.uuid, (m: any) => {
        if (m.content == undefined) m.content = {};
        m.content.offlineOnly = newOfflineOnly;
      })
      .then((item) => {
        const component = item as SNComponent;
        setOfflineOnly(component.offlineOnly);
      })
      .catch((e) => {
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
        const component = item as SNComponent;
        setExtensionName(component.name);
      });
  };

  const localInstallable = extension.package_info.download_url;
  const isThirParty = application.features.isThirdPartyFeature(
    extension.identifier
  );

  return (
    <PreferencesSegment classes={'mb-5'}>
      {first && (
        <>
          <Title>Extensions</Title>
        </>
      )}

      <RenameExtension
        extensionName={extensionName}
        changeName={changeExtensionName}
      />
      <div className="min-h-2" />

      {isThirParty && localInstallable && (
        <UseHosted
          offlineOnly={offlineOnly}
          toggleOfllineOnly={toggleOffllineOnly}
        />
      )}

      <>
        <div className="min-h-2" />
        <div className="flex flex-row">
          <Button
            className="min-w-20"
            type="normal"
            label="Uninstall"
            onClick={() => uninstall(extension)}
          />
        </div>
      </>
    </PreferencesSegment>
  );
};
