import { ContentType, SNComponent } from '@standardnotes/snjs';
import { Button } from '@/components/Button';
import { DecoratedInput } from '@/components/DecoratedInput';
import { WebApplication } from '@/ui_models/application';
import { FunctionComponent } from 'preact';
import {
  Title,
  PreferencesGroup,
  PreferencesPane,
  PreferencesSegment,
} from '../components';
import { ConfirmCustomExtension, ExtensionItem } from './extensions-segments';
import { useCallback, useState } from 'preact/hooks';

export const Extensions: FunctionComponent<{
  application: WebApplication
}> = ({ application }) => {

  const [customUrl, setCustomUrl] = useState('');
  const [confirmableExtension, setConfirmableExtension] = useState<SNComponent | undefined>(undefined);

  const uninstallExtension = (extension: SNComponent) => {
    application.deleteItem(extension);
  };

  const submitExtensionUrl = async (url: string) => {
    const component = await application.downloadExternalFeature(url);
    if (component) {
      setConfirmableExtension(component);
    }
  };

  const handleConfirmExtensionSubmit = async (confirm: boolean) => {
    if (confirm) {
      confirmExtension();
    }
    setConfirmableExtension(undefined);
    setCustomUrl('');
  };

  const confirmExtension = async () => {
    await application.insertItem(confirmableExtension as SNComponent);
  };

  const extensions = application.getItems([
    ContentType.ActionsExtension,
    ContentType.Component,
    ContentType.Theme,
  ]) as SNComponent[];

  return (
    <PreferencesPane>
      <PreferencesGroup>
        {
          extensions
            .filter(extension => extension.package_info.identifier !== 'org.standardnotes.extensions-manager')
            .sort((e1, e2) => e1.name.toLowerCase().localeCompare(e2.name.toLowerCase()))
            .map((extension, i) => (
              <ExtensionItem application={application} extension={extension} first={i === 0} uninstall={uninstallExtension} />
            ))
        }
      </PreferencesGroup>

      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Install Custom Extension</Title>
          <DecoratedInput
            placeholder={'Enter Extension URL'}
            text={customUrl}
            onChange={(value) => { setCustomUrl(value); }}
          />
          <Button
            className="min-w-20"
            type="primary"
            label="Install"
            onClick={() => submitExtensionUrl(customUrl)}
          />
        </PreferencesSegment>
        {confirmableExtension &&
          <PreferencesSegment>
            <ConfirmCustomExtension
              component={confirmableExtension}
              callback={handleConfirmExtensionSubmit}
            ></ConfirmCustomExtension>
          </PreferencesSegment>
        }
      </PreferencesGroup>
    </PreferencesPane>
  );
};
