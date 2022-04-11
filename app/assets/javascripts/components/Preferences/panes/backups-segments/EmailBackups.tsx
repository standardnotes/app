import {
  convertStringifiedBooleanToBoolean,
  isDesktopApplication,
} from '@/utils';
import { STRING_FAILED_TO_UPDATE_USER_SETTING } from '@/strings';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { WebApplication } from '@/ui_models/application';
import { observer } from 'mobx-react-lite';
import {
  PreferencesGroup,
  PreferencesSegment,
  Subtitle,
  Text,
  Title,
} from '../../components';
import { Dropdown, DropdownItem } from '@/components/Dropdown';
import { Switch } from '@/components/Switch';
import { HorizontalSeparator } from '@/components/Shared/HorizontalSeparator';
import {
  FeatureStatus,
  FeatureIdentifier,
  EmailBackupFrequency,
  MuteFailedBackupsEmailsOption,
  SettingName,
} from '@standardnotes/snjs';

type Props = {
  application: WebApplication;
};

export const EmailBackups = observer(({ application }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState<EmailBackupFrequency>(
    EmailBackupFrequency.Disabled
  );
  const [emailFrequencyOptions, setEmailFrequencyOptions] = useState<
    DropdownItem[]
  >([]);
  const [isFailedBackupEmailMuted, setIsFailedBackupEmailMuted] =
    useState(true);
  const [isEntitledToEmailBackups, setIsEntitledToEmailBackups] =
    useState(false);

  const loadEmailFrequencySetting = useCallback(async () => {
    if (!application.getUser()) {
      return;
    }
    setIsLoading(true);

    try {
      const userSettings = await application.settings.listSettings();
      setEmailFrequency(
        userSettings.getSettingValue<EmailBackupFrequency>(
          SettingName.EmailBackupFrequency,
          EmailBackupFrequency.Disabled
        )
      );
      setIsFailedBackupEmailMuted(
        convertStringifiedBooleanToBoolean(
          userSettings.getSettingValue<MuteFailedBackupsEmailsOption>(
            SettingName.MuteFailedBackupsEmails,
            MuteFailedBackupsEmailsOption.NotMuted
          )
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [application]);

  useEffect(() => {
    const emailBackupsFeatureStatus = application.features.getFeatureStatus(
      FeatureIdentifier.DailyEmailBackup
    );
    setIsEntitledToEmailBackups(
      emailBackupsFeatureStatus === FeatureStatus.Entitled
    );

    const frequencyOptions = [];
    for (const frequency in EmailBackupFrequency) {
      const frequencyValue =
        EmailBackupFrequency[frequency as keyof typeof EmailBackupFrequency];
      frequencyOptions.push({
        value: frequencyValue,
        label:
          application.settings.getEmailBackupFrequencyOptionLabel(
            frequencyValue
          ),
      });
    }
    setEmailFrequencyOptions(frequencyOptions);

    loadEmailFrequencySetting();
  }, [application, loadEmailFrequencySetting]);

  const updateSetting = async (
    settingName: SettingName,
    payload: string
  ): Promise<boolean> => {
    try {
      await application.settings.updateSetting(settingName, payload, false);
      return true;
    } catch (e) {
      application.alertService.alert(STRING_FAILED_TO_UPDATE_USER_SETTING);
      return false;
    }
  };

  const updateEmailFrequency = async (frequency: EmailBackupFrequency) => {
    const previousFrequency = emailFrequency;
    setEmailFrequency(frequency);

    const updateResult = await updateSetting(
      SettingName.EmailBackupFrequency,
      frequency
    );
    if (!updateResult) {
      setEmailFrequency(previousFrequency);
    }
  };

  const toggleMuteFailedBackupEmails = async () => {
    if (!isEntitledToEmailBackups) {
      return;
    }
    const previousValue = isFailedBackupEmailMuted;
    setIsFailedBackupEmailMuted(!isFailedBackupEmailMuted);

    const updateResult = await updateSetting(
      SettingName.MuteFailedBackupsEmails,
      `${!isFailedBackupEmailMuted}`
    );
    if (!updateResult) {
      setIsFailedBackupEmailMuted(previousValue);
    }
  };

  const handleEmailFrequencyChange = (item: string) => {
    if (!isEntitledToEmailBackups) {
      return;
    }
    updateEmailFrequency(item as EmailBackupFrequency);
  };

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Email Backups</Title>
        {!isEntitledToEmailBackups && (
          <>
            <Text>
              A <span className={'font-bold'}>Plus</span> or{' '}
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
        <div
          className={
            isEntitledToEmailBackups
              ? ''
              : 'faded cursor-default pointer-events-none'
          }
        >
          {!isDesktopApplication() && (
            <Text className="mb-3">
              Daily encrypted email backups of your entire data set delivered
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
                value={emailFrequency}
                onChange={handleEmailFrequencyChange}
                disabled={!isEntitledToEmailBackups}
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
                disabled={!isEntitledToEmailBackups}
              />
            )}
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
});
