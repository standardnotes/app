import React from 'react';
import { CloudBackupProvider } from './CloudBackupProvider';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { WebApplication } from '@/ui_models/application';
import {
  PreferencesGroup,
  PreferencesSegment,
  Subtitle,
  Text,
  Title,
} from '@/components/Preferences/components';
import { HorizontalSeparator } from '@/components/Shared/HorizontalSeparator';
import { FeatureIdentifier } from '@standardnotes/features';
import { FeatureStatus } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { CloudProvider, SettingName } from '@standardnotes/settings';
import { Switch } from '@/components/Switch';
import { convertStringifiedBooleanToBoolean } from '@/utils';
import { STRING_FAILED_TO_UPDATE_USER_SETTING } from '@/strings';

const providerData = [
  {
    name: CloudProvider.Dropbox,
  },
  {
    name: CloudProvider.Google,
  },
  {
    name: CloudProvider.OneDrive,
  },
];

type Props = {
  application: WebApplication;
};

export const CloudLink: FunctionComponent<Props> = ({ application }) => {
  const [isEntitledToCloudBackups, setIsEntitledToCloudBackups] =
    useState(false);
  const [isFailedCloudBackupEmailMuted, setIsFailedCloudBackupEmailMuted] =
    useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const additionalClass = isEntitledToCloudBackups
    ? ''
    : 'faded cursor-default pointer-events-none';

  const loadIsFailedCloudBackupEmailMutedSetting = useCallback(async () => {
    if (!application.getUser()) {
      return;
    }
    setIsLoading(true);

    try {
      const userSettings = await application.listSettings();
      setIsFailedCloudBackupEmailMuted(
        convertStringifiedBooleanToBoolean(
          userSettings[SettingName.MuteFailedCloudBackupsEmails] as string
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [application]);

  useEffect(() => {
    const dailyDropboxBackupStatus = application.features.getFeatureStatus(
      FeatureIdentifier.DailyDropboxBackup
    );
    const dailyGdriveBackupStatus = application.features.getFeatureStatus(
      FeatureIdentifier.DailyGDriveBackup
    );
    const dailyOneDriveBackupStatus = application.features.getFeatureStatus(
      FeatureIdentifier.DailyOneDriveBackup
    );
    const isCloudBackupsAllowed = [
      dailyDropboxBackupStatus,
      dailyGdriveBackupStatus,
      dailyOneDriveBackupStatus,
    ].every((status) => status === FeatureStatus.Entitled);

    setIsEntitledToCloudBackups(isCloudBackupsAllowed);
    loadIsFailedCloudBackupEmailMutedSetting();
  }, [application, loadIsFailedCloudBackupEmailMutedSetting]);

  const updateSetting = async (
    settingName: SettingName,
    payload: string
  ): Promise<boolean> => {
    try {
      await application.updateSetting(settingName, payload);
      return true;
    } catch (e) {
      application.alertService.alert(STRING_FAILED_TO_UPDATE_USER_SETTING);
      return false;
    }
  };

  const toggleMuteFailedCloudBackupEmails = async () => {
    const previousValue = isFailedCloudBackupEmailMuted;
    setIsFailedCloudBackupEmailMuted(!isFailedCloudBackupEmailMuted);

    const updateResult = await updateSetting(
      SettingName.MuteFailedCloudBackupsEmails,
      `${!isFailedCloudBackupEmailMuted}`
    );
    if (!updateResult) {
      setIsFailedCloudBackupEmailMuted(previousValue);
    }
  };

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Cloud Backups</Title>
        {!isEntitledToCloudBackups && (
          <>
            <Text>
              A <span className={'font-bold'}>Plus</span> or{' '}
              <span className={'font-bold'}>Pro</span> subscription plan is
              required to enable Cloud Backups.{' '}
              <a target="_blank" href="https://standardnotes.com/features">
                Learn more
              </a>
              .
            </Text>
            <HorizontalSeparator classes="mt-3 mb-3" />
          </>
        )}
        <div>
          <Text className={additionalClass}>
            Configure the integrations below to enable automatic daily backups
            of your encrypted data set to your third-party cloud provider.
          </Text>
          <div>
            <HorizontalSeparator classes={`mt-3 mb-3 ${additionalClass}`} />
            <div>
              {providerData.map(({ name }) => (
                <>
                  <CloudBackupProvider
                    application={application}
                    providerName={name}
                    isEntitledToCloudBackups={isEntitledToCloudBackups}
                  />
                  <HorizontalSeparator
                    classes={`mt-3 mb-3 ${additionalClass}`}
                  />
                </>
              ))}
            </div>
          </div>

          <div className={additionalClass}>
            <Subtitle>Email preferences</Subtitle>
            <div className="flex items-center justify-between mt-1">
              <div className="flex flex-col">
                <Text>
                  Receive a notification email if a cloud backup fails.
                </Text>
              </div>
              {isLoading ? (
                <div className={'sk-spinner info small'} />
              ) : (
                <Switch
                  onChange={toggleMuteFailedCloudBackupEmails}
                  checked={!isFailedCloudBackupEmailMuted}
                />
              )}
            </div>
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
};
