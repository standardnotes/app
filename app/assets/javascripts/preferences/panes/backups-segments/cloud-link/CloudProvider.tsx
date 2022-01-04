import React from 'react';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { ButtonType, SettingName, SNItem } from '@standardnotes/snjs';
import { WebApplication } from '@/ui_models/application';
import { Button } from '@/components/Button';
import { openInNewTab } from '@/utils';
import { Subtitle, Text } from '@/preferences/components';
import { KeyboardKey } from '@Services/ioService';
import { FunctionComponent } from 'preact';

export enum ProviderType {
  Dropbox = 'Dropbox',
  Google = 'Google Drive',
  OneDrive = 'OneDrive',
}

type Props = {
  application: WebApplication;
  name: ProviderType;
};

export const CloudProvider: FunctionComponent<Props> = ({
  application,
  name,
}) => {
  const [authBegan, setAuthBegan] = useState(false);
  const [successfullyInstalled, setSuccessfullyInstalled] = useState(false);
  const [integrationToken, setIntegrationToken] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState('');

  const getAuthUrl = () => {
    // TODO: take the correct links (from SNJS)
    switch (name) {
      case ProviderType.Dropbox:
        return 'https://www.dropbox.com/1/oauth2/authorize?client_id=7wzjlm5ap227jw7&response_type=code&redirect_uri=https://extensions-server-dev.standardnotes.org/dropbox/auth_redirect';
      case ProviderType.Google:
        return 'https://accounts.google.com/o/oauth2/auth/oauthchooseaccount?access_type=offline&client_id=1031174943822-adi9auubef1eo6agmanmb12j2b9fr7ef.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fextensions-server-dev.standardnotes.org%2Fgdrive&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file&flowName=GeneralOAuthFlow';
      case ProviderType.OneDrive:
        return 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=706bd9c2-215d-4b5f-a9b5-b466d18ba246&scope=Files.ReadWrite.AppFolder%20Files.ReadWrite.All%20offline_access&response_type=code&redirect_uri=https://extensions-server-dev.standardnotes.org/onedrive/auth_redirect';
      default:
        throw new Error('Invalid Cloud Provider name');
    }
  };

  const disable = async (event: Event) => {
    event.stopPropagation();

    application.alertService
      .confirm(
        'Are you sure you want to disable this integration?',
        'Disable?',
        'Disable',
        ButtonType.Danger,
        'Cancel'
      )
      .then(async (shouldRemove: boolean) => {
        if (shouldRemove) {
          await application.deleteSetting(getSettingName());
          await updateIntegrationStatus();
        }
      })
      .catch((err: string) => {
        application.alertService.alert(err);
      });
  };

  const install = (event: Event, authUrl: string) => {
    event.stopPropagation();
    openInNewTab(authUrl);
    setAuthBegan(true);
  };

  const performBackupNow = async () => {
    // A backup is performed anytime the extension is saved, so just save it here
    try {
      await application.updateSetting(getSettingName(), integrationToken || '');
      application.alertService.alert(
        'A backup has been triggered for this provider. Please allow a couple minutes for your backup to be processed.'
      );
    } catch (err) {
      application.alertService.alert(
        'There was an error while trying to trigger a backup for this provider. Please try again.'
      );
    }
  };

  // TODO: this methods is very similar to `getAuthUrl`. If the latter is not abandoned, think if they can be somehow combined
  const getSettingName = useCallback(() => {
    switch (name) {
      case ProviderType.Dropbox:
        return SettingName.DropboxBackupToken;
      case ProviderType.Google:
        return SettingName.GoogleDriveBackupToken;
      case ProviderType.OneDrive:
        return SettingName.OneDriveBackupToken;
      default:
        throw new Error('Invalid Cloud Provider name');
    }
  }, [name]);

  const getCloudProviderIntegrationTokenFromUrl = (url: URL) => {
    const urlSearchParams = new URLSearchParams(url.search);
    let integrationTokenKeyInUrl = '';

    switch (name) {
      case ProviderType.Dropbox:
        integrationTokenKeyInUrl = 'dbt';
        break;
      case ProviderType.Google:
        integrationTokenKeyInUrl = 'key';
        break;
      case ProviderType.OneDrive:
        integrationTokenKeyInUrl = 'key';
        break;
      default:
        throw new Error('Invalid Cloud Provider name');
    }
    return urlSearchParams.get(integrationTokenKeyInUrl);
  };

  const handleKeyPress = async (event: KeyboardEvent) => {
    if (event.key === KeyboardKey.Enter) {
      try {
        const decryptedCode = atob(confirmation);
        const urlFromDecryptedCode = new URL(decryptedCode);
        const cloudProviderToken =
          getCloudProviderIntegrationTokenFromUrl(urlFromDecryptedCode);

        if (!cloudProviderToken) {
          throw new Error();
        }
        await application.updateSetting(getSettingName(), cloudProviderToken);

        await updateIntegrationStatus();

        setAuthBegan(false);
        setSuccessfullyInstalled(true);

        await application.alertService.alert(
          `${name} has been successfully installed. Your first backup has also been queued and should be reflected in your external cloud's folder within the next few minutes.`
        );
      } catch (e) {
        await application.alertService.alert('Invalid code. Please try again.');
      }
    }
  };

  const handleChange = (event: Event) => {
    setConfirmation((event.target as HTMLInputElement).value);
  };

  const updateIntegrationStatus = useCallback(async () => {
    const token = await application.getSetting(getSettingName());
    setIntegrationToken(token);
  }, [application, getSettingName]);

  useEffect(() => {
    updateIntegrationStatus();
  }, [updateIntegrationStatus]);

  const isExpanded = authBegan || successfullyInstalled;
  const shouldShowEnableButton = !integrationToken && !authBegan;

  return (
    <div
      className={`mr-1 ${isExpanded ? 'expanded' : ' '} ${
        shouldShowEnableButton || integrationToken
          ? 'flex justify-between items-center'
          : ''
      }`}
    >
      <div>
        <Subtitle>{name}</Subtitle>

        {successfullyInstalled && (
          <p>{name} has been successfully installed.</p>
        )}
      </div>
      {authBegan && (
        <div>
          <p className="sk-panel-row">
            Complete authentication from the newly opened window. Upon
            completion, a confirmation code will be displayed. Enter this code
            below:
          </p>
          <div className={`mt-1`}>
            <input
              className="sk-input sk-base center-text"
              placeholder="Enter confirmation code"
              value={confirmation}
              onKeyPress={handleKeyPress}
              onChange={handleChange}
            />
          </div>
        </div>
      )}
      {shouldShowEnableButton && (
        <div>
          <Button
            type="normal"
            label="Enable"
            className={'px-1 text-xs min-w-40'}
            onClick={(event) => {
              install(event, getAuthUrl() as string);
            }}
          />
        </div>
      )}

      {integrationToken && (
        <div className={'flex flex-col items-end'}>
          <Button
            className="min-w-40 mb-2"
            type="normal"
            label="Perform Backup"
            onClick={performBackupNow}
          />
          <Button
            className="min-w-40"
            type="normal"
            label="Disable"
            onClick={disable}
          />
        </div>
      )}
    </div>
  );
};
