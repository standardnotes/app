import { ContentType } from '@/../../../../snjs/packages/features/dist';
import { SNComponent } from '@/../../../../snjs/packages/snjs/dist/@types';
import { Button } from '@/components/Button';
import { DecoratedInput } from '@/components/DecoratedInput';
import { WebApplication } from '@/ui_models/application';
import { FunctionComponent } from 'preact';
import { useState } from 'react';
import {
  Title,
  PreferencesGroup,
  PreferencesPane,
  PreferencesSegment,
} from '../components';
import { ConfirmCustomExtension } from './extensions/ConfirmCustomExtension';

export const Extensions: FunctionComponent<{
  application: WebApplication
}> = ({application}) => {

  const [customUrl, setCustomUrl] = useState('');
  const [confirmableExtension, setConfirmableExtension] = useState<SNComponent | undefined>(undefined);

  const submitExtensionUrl = async (url: string) => {
    const component = await application.downloadExternalFeature(url);
    if (component) {
      setConfirmableExtension(component);
    }
  };

  const handleConfirmExtensionSubmit = async (confirm: boolean) => {
    if(confirm) {
      confirmExtension();
    }
    setConfirmableExtension(undefined);
    setCustomUrl('');
  };

  const confirmExtension = async () => {
    await application.insertItem(confirmableExtension as SNComponent);
  };

  const uninstallExtension = (extension: SNComponent) => {
    application.deleteItem(extension);
  };

  const extensions = application.getItems([
    ContentType.ActionsExtension,
    ContentType.Component,
    ContentType.Theme,
  ]) as SNComponent[];

  return (
    <PreferencesPane>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Available Extensions</Title>
        </PreferencesSegment>
        {extensions.map((extension) => (
          <PreferencesSegment>
            <Title>{extension.name}</Title>
          </PreferencesSegment>
        ))}
      </PreferencesGroup>

      <PreferencesGroup>
      <PreferencesSegment>
          <Title>Install Custom Extension</Title>
          <DecoratedInput
            placeholder={'Enter Extension URL'}
            text={customUrl}
            onChange={(value) => {setCustomUrl(value);}}
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
