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
import { useEffect, useRef, useState } from 'preact/hooks';

const loadExtensions = (application: WebApplication) => application.getItems([
  ContentType.ActionsExtension,
  ContentType.Component,
  ContentType.Theme,
]) as SNComponent[];

export const Extensions: FunctionComponent<{
  application: WebApplication
}> = ({ application }) => {

  const [customUrl, setCustomUrl] = useState('');
  const [confirmableExtension, setConfirmableExtension] = useState<SNComponent | undefined>(undefined);
  const [extensions, setExtensions] = useState(loadExtensions(application));

  const confirmableEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (confirmableExtension) {
      confirmableEnd.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [confirmableExtension, confirmableEnd]);

  const uninstallExtension = async (extension: SNComponent) => {
    await application.deleteItem(extension);
    setExtensions(loadExtensions(application));
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
    setExtensions(loadExtensions(application));
  };

  const toggleActivateExtension = (extension: SNComponent) => {
    application.toggleComponent(extension);
    setExtensions(loadExtensions(application));
  };

  return (
    <PreferencesPane>
      <PreferencesGroup>
        {
          extensions
            .filter(extension => extension.package_info.identifier !== 'org.standardnotes.extensions-manager')
            .sort((e1, e2) => e1.name.toLowerCase().localeCompare(e2.name.toLowerCase()))
            .map((extension, i) => (
              <ExtensionItem application={application} extension={extension}
                first={i === 0} uninstall={uninstallExtension} toggleActivate={toggleActivateExtension} />
            ))
        }
      </PreferencesGroup>

      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Install Custom Extension</Title>
          <div className="min-h-2" />
          <DecoratedInput
            placeholder={'Enter Extension URL'}
            text={customUrl}
            onChange={(value) => { setCustomUrl(value); }}
          />
          <div className="min-h-1" />
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
            />
            <div ref={confirmableEnd} />
          </PreferencesSegment>
        }
      </PreferencesGroup>
    </PreferencesPane>
  );
};
