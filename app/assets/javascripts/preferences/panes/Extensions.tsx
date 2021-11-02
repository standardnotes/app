import { ButtonType, ContentType, SNComponent, TRUSTED_FEATURE_URL_HOSTS } from '@standardnotes/snjs';
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
import { ConfirmCustomExtension, ExtensionItem, ExtensionsLatestVersions } from './extensions-segments';
import { useEffect, useRef, useState } from 'preact/hooks';
import { observer } from 'mobx-react-lite';
import {
  STRING_INVALID_EXTENSION_URL,
  STRING_UNTRUSTED_EXTENSIONS_WARNING
} from '@/strings';
import { TRUSTED_CUSTOM_EXTENSIONS_URL_HOSTS } from '@Views/constants';

const loadExtensions = (application: WebApplication) => application.getItems([
  ContentType.ActionsExtension,
  ContentType.Component,
  ContentType.Theme,
], true) as SNComponent[];

export const Extensions: FunctionComponent<{
  application: WebApplication
  extensionsLatestVersions: ExtensionsLatestVersions,
}> = observer(({ application, extensionsLatestVersions }) => {

  const [customUrl, setCustomUrl] = useState('');
  const [confirmableExtension, setConfirmableExtension] = useState<SNComponent | undefined>(undefined);
  const [extensions, setExtensions] = useState(loadExtensions(application));

  const confirmableEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (confirmableExtension) {
      confirmableEnd.current!.scrollIntoView({ behavior: 'smooth' });
    }
  }, [confirmableExtension, confirmableEnd]);

  const uninstallExtension = async (extension: SNComponent) => {
    await application.deleteItem(extension);
    setExtensions(loadExtensions(application));
  };

  const downloadExternalFeature = async (url: string) => {
    const component = await application.downloadExternalFeature(url);
    if (component) {
      setConfirmableExtension(component);
    }
  };

  const submitExtensionUrl = async (url: string) => {
    try {
      const trustedCustomExtensionsUrls = [
        ...TRUSTED_FEATURE_URL_HOSTS,
        ...TRUSTED_CUSTOM_EXTENSIONS_URL_HOSTS
      ];
      const { host } = new URL(url);

      if (!trustedCustomExtensionsUrls.includes(host)) {
        application.alertService.confirm(
          STRING_UNTRUSTED_EXTENSIONS_WARNING,
          'Install extension from an untrusted source?',
          'Proceed to install',
          ButtonType.Danger,
          'Cancel'
        )
          .then(async (allowInstallation: boolean) => {
            if (allowInstallation) {
              await downloadExternalFeature(url);
            }
          })
          .catch((err: string) => {
            application.alertService.alert(err);
          });
      } else {
        await downloadExternalFeature(url);
      }
    } catch (err) {
      application.alertService.alert(STRING_INVALID_EXTENSION_URL);
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

  const visibleExtensions = extensions
    .filter(extension => !['modal', 'rooms'].includes(extension.area));

  return (
    <PreferencesPane>
      {visibleExtensions.length > 0 &&
        <PreferencesGroup>
          {
            visibleExtensions
              .sort((e1, e2) => e1.name.toLowerCase().localeCompare(e2.name.toLowerCase()))
              .map((extension, i) => (
                <ExtensionItem
                  application={application}
                  extension={extension}
                  latestVersion={extensionsLatestVersions.getVersion(extension)}
                  first={i === 0}
                  uninstall={uninstallExtension}
                  toggleActivate={toggleActivateExtension} />
              ))
          }
        </PreferencesGroup>
      }

      <PreferencesGroup>
        {!confirmableExtension &&
          <PreferencesSegment>
            <Title>Install Custom Extension</Title>
            <div className="min-h-2" />
            <DecoratedInput
              placeholder={'Enter Extension URL'}
              text={customUrl}
              onChange={(value) => { setCustomUrl(value); }}
            />
            <div className="min-h-2" />
            <Button
              className="min-w-20"
              type="normal"
              label="Install"
              onClick={() => submitExtensionUrl(customUrl)}
            />

          </PreferencesSegment>
        }
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
});
