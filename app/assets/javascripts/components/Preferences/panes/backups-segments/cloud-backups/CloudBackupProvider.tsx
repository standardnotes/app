import { useCallback, useEffect, useState } from 'preact/hooks';
import { ButtonType, SettingName } from '@standardnotes/snjs';
import {
  CloudProvider,
  DropboxBackupFrequency,
  GoogleDriveBackupFrequency,
  OneDriveBackupFrequency,
} from '@standardnotes/settings';
import { WebApplication } from '@/ui_models/application';
import { Button } from '@/components/Button';
import { isDev, openInNewTab } from '@/utils';
import { Subtitle } from '@/components/Preferences/components';
import { KeyboardKey } from '@Services/ioService';
import { FunctionComponent } from 'preact';

type Props = {
  application: WebApplication;
  providerName: CloudProvider;
  isEntitledToCloudBackups: boolean;
};

export const CloudBackupProvider: FunctionComponent<Props> = ({
  application,
  providerName,
  isEntitledToCloudBackups,
}) => {
  const [authBegan, setAuthBegan] = useState(false);
  const [successfullyInstalled, setSuccessfullyInstalled] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState<string | undefined>(
    undefined
  );
  const [confirmation, setConfirmation] = useState('');

  const disable = async (event: Event) => {
    event.stopPropagation();

    try {
      const shouldDisable = await application.alertService.confirm(
        'Are you sure you want to disable this integration?',
        'Disable?',
        'Disable',
        ButtonType.Danger,
        'Cancel'
      );
      if (shouldDisable) {
        await application.settings.deleteSetting(backupFrequencySettingName);
        await application.settings.deleteSetting(backupTokenSettingName);

        setBackupFrequency(undefined);
      }
    } catch (error) {
      application.alertService.alert(error as string);
    }
  };

  const installIntegration = (event: Event) => {
    event.stopPropagation();

    const authUrl = application.getCloudProviderIntegrationUrl(
      providerName,
      isDev
    );
    openInNewTab(authUrl);
    setAuthBegan(true);
  };

  const performBackupNow = async () => {
    // A backup is performed anytime the setting is updated with the integration token, so just update it here
    try {
      await application.settings.updateSetting(
        backupFrequencySettingName,
        backupFrequency as string
      );
      application.alertService.alert(
        'A backup has been triggered for this provider. Please allow a couple minutes for your backup to be processed.'
      );
    } catch (err) {
      application.alertService.alert(
        'There was an error while trying to trigger a backup for this provider. Please try again.'
      );
    }
  };

  const backupSettingsData = {
    [CloudProvider.Dropbox]: {
      backupTokenSettingName: SettingName.DropboxBackupToken,
      backupFrequencySettingName: SettingName.DropboxBackupFrequency,
      defaultBackupFrequency: DropboxBackupFrequency.Daily,
    },
    [CloudProvider.Google]: {
      backupTokenSettingName: SettingName.GoogleDriveBackupToken,
      backupFrequencySettingName: SettingName.GoogleDriveBackupFrequency,
      defaultBackupFrequency: GoogleDriveBackupFrequency.Daily,
    },
    [CloudProvider.OneDrive]: {
      backupTokenSettingName: SettingName.OneDriveBackupToken,
      backupFrequencySettingName: SettingName.OneDriveBackupFrequency,
      defaultBackupFrequency: OneDriveBackupFrequency.Daily,
    },
  };
  const {
    backupTokenSettingName,
    backupFrequencySettingName,
    defaultBackupFrequency,
  } = backupSettingsData[providerName];

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
        await application.settings.updateSetting(
          backupTokenSettingName,
          cloudProviderToken
        );
        await application.settings.updateSetting(
          backupFrequencySettingName,
          defaultBackupFrequency
        );

        setBackupFrequency(defaultBackupFrequency);

        setAuthBegan(false);
        setSuccessfullyInstalled(true);
        setConfirmation('');

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

  const getIntegrationStatus = useCallback(async () => {
    if (!application.getUser()) {
      return;
    }
    const frequency = await application.settings.getSetting(
      backupFrequencySettingName
    );
    setBackupFrequency(frequency);
  }, [application, backupFrequencySettingName]);

  useEffect(() => {
    getIntegrationStatus();
  }, [getIntegrationStatus]);

  const isExpanded = authBegan || successfullyInstalled;
  const shouldShowEnableButton = !backupFrequency && !authBegan;
  const additionalClass = isEntitledToCloudBackups
    ? ''
    : 'faded cursor-default pointer-events-none';

  return (
    <div
      className={`mr-1 ${isExpanded ? 'expanded' : ' '} ${
        shouldShowEnableButton || backupFrequency
          ? 'flex justify-between items-center'
          : ''
      }`}
    >
      <div>
        <Subtitle className={additionalClass}>{providerName}</Subtitle>

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
            className={`px-1 text-xs min-w-40 ${additionalClass}`}
            onClick={installIntegration}
          />
        </div>
      )}

      {backupFrequency && (
        <div className={'flex flex-col items-end'}>
          <Button
            className={`min-w-40 mb-2 ${additionalClass}`}
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
