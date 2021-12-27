import { ButtonType, ContentType, SNComponent } from '@standardnotes/snjs';
import { Button } from '@/components/Button';
import { DecoratedInput } from '@/components/DecoratedInput';
import { WebApplication } from '@/ui_models/application';
import { FunctionComponent } from 'preact';
import { Title, PreferencesSegment } from '../components';
import {
  ConfirmCustomExtension,
  ExtensionItem,
  ExtensionsLatestVersions,
} from './extensions-segments';
import { useEffect, useRef, useState } from 'preact/hooks';
import { observer } from 'mobx-react-lite';

const loadExtensions = (application: WebApplication) =>
  application.getItems(
    [ContentType.ActionsExtension, ContentType.Component, ContentType.Theme],
    true
  ) as SNComponent[];

export const Extensions: FunctionComponent<{
  application: WebApplication;
  extensionsLatestVersions: ExtensionsLatestVersions;
  className?: string;
}> = observer(({ application, extensionsLatestVersions, className = '' }) => {
  const [customUrl, setCustomUrl] = useState('');
  const [confirmableExtension, setConfirmableExtension] = useState<
    SNComponent | undefined
  >(undefined);
  const [extensions, setExtensions] = useState(loadExtensions(application));

  const confirmableEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (confirmableExtension) {
      confirmableEnd.current!.scrollIntoView({ behavior: 'smooth' });
    }
  }, [confirmableExtension, confirmableEnd]);

  const uninstallExtension = async (extension: SNComponent) => {
    application.alertService
      .confirm(
        'Are you sure you want to uninstall this extension? Note that extensions managed by your subscription will automatically be re-installed on application restart.',
        'Uninstall Extension?',
        'Uninstall',
        ButtonType.Danger,
        'Cancel'
      )
      .then(async (shouldRemove: boolean) => {
        if (shouldRemove) {
          await application.deleteItem(extension);
          setExtensions(loadExtensions(application));
        }
      })
      .catch((err: string) => {
        application.alertService.alert(err);
      });
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

  const visibleExtensions = extensions.filter((extension) => {
    return (
      extension.package_info != undefined &&
      !['modal', 'rooms'].includes(extension.area)
    );
  });

  return (
    <div className={className}>
      {visibleExtensions.length > 0 && (
        <div>
          {visibleExtensions
            .sort((e1, e2) =>
              e1.name?.toLowerCase().localeCompare(e2.name?.toLowerCase())
            )
            .map((extension, i) => (
              <ExtensionItem
                key={extension.uuid}
                application={application}
                extension={extension}
                latestVersion={extensionsLatestVersions.getVersion(extension)}
                first={i === 0}
                uninstall={uninstallExtension}
              />
            ))}
        </div>
      )}

      <div>
        {!confirmableExtension && (
          <PreferencesSegment>
            <Title>Install Custom Extension</Title>
            <div className="min-h-2" />
            <DecoratedInput
              placeholder={'Enter Extension URL'}
              text={customUrl}
              onChange={(value) => {
                setCustomUrl(value);
              }}
            />
            <div className="min-h-2" />
            <Button
              className="min-w-20"
              type="normal"
              label="Install"
              onClick={() => submitExtensionUrl(customUrl)}
            />
          </PreferencesSegment>
        )}
        {confirmableExtension && (
          <PreferencesSegment>
            <ConfirmCustomExtension
              component={confirmableExtension}
              callback={handleConfirmExtensionSubmit}
            />
            <div ref={confirmableEnd} />
          </PreferencesSegment>
        )}
      </div>
    </div>
  );
});
