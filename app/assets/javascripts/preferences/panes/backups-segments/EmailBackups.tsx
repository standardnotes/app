import { capitalizeFirstLetter, isDesktopApplication } from '@/utils';
import { STRING_FAILED_TO_UPDATE_USER_SETTING } from '@/strings';
import { useEffect, useState } from 'preact/hooks';
import { WebApplication } from '@/ui_models/application';
import { observer } from 'mobx-react-lite';
import {
  PreferencesGroup,
  PreferencesSegment,
  Subtitle,
  Text,
  Title,
} from '../../components';
import { EmailBackupFrequency, SettingName } from '@standardnotes/settings';
import { Dropdown, DropdownItem } from '@/components/Dropdown';
import { Switch } from '@/components/Switch';
import { HorizontalSeparator } from '@/components/shared/HorizontalSeparator';
import { FeatureIdentifier } from '@standardnotes/features';
import { FeatureStatus } from '@standardnotes/snjs';

type Props = {
  application: WebApplication;
};

export const EmailBackups = observer(({ application }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState<EmailBackupFrequency>(
    EmailBackupFrequency.Weekly
  );
  const [emailFrequencyOptions, setEmailFrequencyOptions] = useState<
    DropdownItem[]
  >([]);
  const [isFailedBackupEmailMuted, setIsFailedBackupEmailMuted] =
    useState(false);
  const [isFailedCloudBackupEmailMuted, setIsFailedCloudBackupEmailMuted] =
    useState(false);
  const [isEntitledForEmailBackups, setIsEntitledForEmailBackups] =
    useState(false);

  const convertBooleanStringToBoolean = (value: string) => {
    return value !== 'false';
  };

  useEffect(() => {
    const emailBackupsFeatureStatus = application.getFeatureStatus(
      FeatureIdentifier.DailyEmailBackup
    );
    setIsEntitledForEmailBackups(
      emailBackupsFeatureStatus === FeatureStatus.Entitled
    );

    const loadEmailFrequencySetting = async () => {
      setIsLoading(true);

      try {
        const userSettings = await application.listSettings();
        setEmailFrequency(userSettings.EMAIL_BACKUP as EmailBackupFrequency);
        setIsFailedBackupEmailMuted(
          convertBooleanStringToBoolean(
            userSettings[SettingName.MuteFailedBackupsEmails] as string
          )
        );
        setIsFailedCloudBackupEmailMuted(
          convertBooleanStringToBoolean(
            userSettings[SettingName.MuteFailedCloudBackupsEmails] as string
          )
        );
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    const frequencyOptions = [];
    for (const frequency in EmailBackupFrequency) {
      const frequencyValue =
        EmailBackupFrequency[frequency as keyof typeof EmailBackupFrequency];
      frequencyOptions.push({
        value: frequencyValue,
        label: capitalizeFirstLetter(frequencyValue),
      });
    }
    setEmailFrequencyOptions(frequencyOptions);

    loadEmailFrequencySetting();
  }, [application]);

  const updateUserSetting = async (
    settingName: SettingName,
    payload: string
  ) => {
    try {
      await application.updateSetting(settingName, payload);
    } catch (e) {
      application.alertService.alert(STRING_FAILED_TO_UPDATE_USER_SETTING);
    }
  };

  const updateEmailFrequency = async (frequency: EmailBackupFrequency) => {
    setEmailFrequency(frequency);

    await updateUserSetting(SettingName.EmailBackup, frequency);
  };

  const toggleMuteFailedBackupEmails = async () => {
    setIsFailedBackupEmailMuted(!isFailedBackupEmailMuted);
    await updateUserSetting(
      SettingName.MuteFailedBackupsEmails,
      `${!isFailedBackupEmailMuted}`
    );
  };

  const toggleMuteFailedCloudBackupEmails = async () => {
    setIsFailedCloudBackupEmailMuted(!isFailedCloudBackupEmailMuted);

    await updateUserSetting(
      SettingName.MuteFailedCloudBackupsEmails,
      `${!isFailedCloudBackupEmailMuted}`
    );
  };

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Email Backups</Title>
        {!isEntitledForEmailBackups && (
          <>
            <Text>
              <span className={'font-bold'}>Plus</span> or{' '}
              <span className={'font-bold'}>Pro</span> subscription plan is
              required to enable Email Backups.{' '}
              <a target="_blank" href="https://standardnotes.com/features">
                Learn more
              </a>
              .
            </Text>
            <HorizontalSeparator classes="mt-3 mb-3" />
          </>
        )}
        <div className={isEntitledForEmailBackups ? '' : 'dimmed'}>
          {!isDesktopApplication() && (
            <Text className="mb-3">
              Daily encrypted email backups of your entire dataset delivered
              directly to your inbox.
            </Text>
          )}
          <Subtitle>Email frequency</Subtitle>
          <Text>How often to receive backups.</Text>
          <div className="mt-2">
            {isLoading ? (
              <div className={'sk-spinner info small'} />
            ) : (
              <Dropdown
                id="def-editor-dropdown"
                label="Select email frequency"
                items={emailFrequencyOptions}
                defaultValue={emailFrequency}
                onChange={(item) => {
                  updateEmailFrequency(item as EmailBackupFrequency);
                }}
              />
            )}
          </div>
          <HorizontalSeparator classes="mt-5 mb-4" />
          <Subtitle>Email preferences</Subtitle>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Text>
                Receive a notification email if an email backup fails.
              </Text>
            </div>
            {isLoading ? (
              <div className={'sk-spinner info small'} />
            ) : (
              <Switch
                onChange={toggleMuteFailedBackupEmails}
                checked={!isFailedBackupEmailMuted}
              />
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex flex-col">
              <Text>Receive a notification email if a cloud backup fails.</Text>
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
      </PreferencesSegment>
    </PreferencesGroup>
  );
});
