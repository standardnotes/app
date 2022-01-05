import React from 'react';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { ButtonType, SettingName } from '@standardnotes/snjs';
import { CloudProvider } from '@standardnotes/settings';
import { WebApplication } from '@/ui_models/application';
import { Button } from '@/components/Button';
import { openInNewTab } from '@/utils';
import { Subtitle } from '@/preferences/components';
import { KeyboardKey } from '@Services/ioService';
import { FunctionComponent } from 'preact';

type Props = {
  application: WebApplication;
  providerName: CloudProvider;
};

export const CloudBackupProvider: FunctionComponent<Props> = ({
  application,
  providerName,
}) => {
  const [authBegan, setAuthBegan] = useState(false);
  const [successfullyInstalled, setSuccessfullyInstalled] = useState(false);
  const [integrationToken, setIntegrationToken] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState('');

  const disable = async (event: Event) => {
    event.stopPropagation();

    try {
      const shouldDisable = await application.alertService
        .confirm(
          'Are you sure you want to disable this integration?',
          'Disable?',
          'Disable',
          ButtonType.Danger,
          'Cancel'
        );
      if (shouldDisable) {
        await application.deleteSetting(getSettingName());
        await updateIntegrationStatus();
      }
    } catch (error) {
      application.alertService.alert(error as string);
    }
  };

  const installIntegration = (event: Event) => {
    event.stopPropagation();

    const authUrl = application.getCloudProviderIntegrationUrl(providerName);
    openInNewTab(authUrl);
    setAuthBegan(true);
  };

  const performBackupNow = async () => {
    // A backup is performed anytime the setting is updated with the integration token, so just update it here
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

  const getSettingName = useCallback(() => {
    switch (providerName) {
      case CloudProvider.Dropbox:
        return SettingName.DropboxBackupToken;
      case CloudProvider.Google:
        return SettingName.GoogleDriveBackupToken;
      case CloudProvider.OneDrive:
        return SettingName.OneDriveBackupToken;
      default:
        throw new Error('Invalid Cloud Provider name');
    }
  }, [providerName]);

  const getCloudProviderIntegrationTokenFromUrl = (url: URL) => {
    const urlSearchParams = new URLSearchParams(url.search);
    let integrationTokenKeyInUrl = '';

    switch (providerName) {
      case CloudProvider.Dropbox:
        integrationTokenKeyInUrl = 'dbt';
        break;
      case CloudProvider.Google:
        integrationTokenKeyInUrl = 'key';
        break;
      case CloudProvider.OneDrive:
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
          `${providerName} has been successfully installed. Your first backup has also been queued and should be reflected in your external cloud's folder within the next few minutes.`
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
        <Subtitle>{providerName}</Subtitle>

        {successfullyInstalled && (
          <p>{providerName} has been successfully enabled.</p>
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
            onClick={installIntegration}
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
