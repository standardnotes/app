import CloudBackupProvider from './CloudBackupProvider'
import { useCallback, useEffect, useState, FunctionComponent, Fragment } from 'react'
import { WebApplication } from '@/Application/Application'
import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import {
  FeatureStatus,
  FeatureIdentifier,
  CloudProvider,
  MuteFailedCloudBackupsEmailsOption,
  SettingName,
} from '@standardnotes/snjs'

import Switch from '@/Components/Switch/Switch'
import { convertStringifiedBooleanToBoolean } from '@/Utils'
import { STRING_FAILED_TO_UPDATE_USER_SETTING } from '@/Strings'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'

const providerData = [{ name: CloudProvider.Dropbox }, { name: CloudProvider.Google }, { name: CloudProvider.OneDrive }]

type Props = {
  application: WebApplication
}

const CloudLink: FunctionComponent<Props> = ({ application }) => {
  const [isEntitledToCloudBackups, setIsEntitledToCloudBackups] = useState(false)
  const [isFailedCloudBackupEmailMuted, setIsFailedCloudBackupEmailMuted] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const additionalClass = isEntitledToCloudBackups ? '' : 'faded cursor-default pointer-events-none'

  const loadIsFailedCloudBackupEmailMutedSetting = useCallback(async () => {
    if (!application.getUser()) {
      return
    }
    setIsLoading(true)

    try {
      const userSettings = await application.settings.listSettings()
      setIsFailedCloudBackupEmailMuted(
        convertStringifiedBooleanToBoolean(
          userSettings.getSettingValue(
            SettingName.MuteFailedCloudBackupsEmails,
            MuteFailedCloudBackupsEmailsOption.NotMuted,
          ),
        ),
      )
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [application])

  useEffect(() => {
    const dailyDropboxBackupStatus = application.features.getFeatureStatus(FeatureIdentifier.DailyDropboxBackup)
    const dailyGdriveBackupStatus = application.features.getFeatureStatus(FeatureIdentifier.DailyGDriveBackup)
    const dailyOneDriveBackupStatus = application.features.getFeatureStatus(FeatureIdentifier.DailyOneDriveBackup)
    const isCloudBackupsAllowed = [dailyDropboxBackupStatus, dailyGdriveBackupStatus, dailyOneDriveBackupStatus].every(
      (status) => status === FeatureStatus.Entitled,
    )

    setIsEntitledToCloudBackups(isCloudBackupsAllowed)
    loadIsFailedCloudBackupEmailMutedSetting().catch(console.error)
  }, [application, loadIsFailedCloudBackupEmailMutedSetting])

  const updateSetting = async (settingName: SettingName, payload: string): Promise<boolean> => {
    try {
      await application.settings.updateSetting(settingName, payload)
      return true
    } catch (e) {
      application.alertService.alert(STRING_FAILED_TO_UPDATE_USER_SETTING).catch(console.error)
      return false
    }
  }

  const toggleMuteFailedCloudBackupEmails = async () => {
    if (!isEntitledToCloudBackups) {
      return
    }
    const previousValue = isFailedCloudBackupEmailMuted
    setIsFailedCloudBackupEmailMuted(!isFailedCloudBackupEmailMuted)

    const updateResult = await updateSetting(
      SettingName.MuteFailedCloudBackupsEmails,
      `${!isFailedCloudBackupEmailMuted}`,
    )
    if (!updateResult) {
      setIsFailedCloudBackupEmailMuted(previousValue)
    }
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Cloud Backups</Title>
        {!isEntitledToCloudBackups && (
          <>
            <Text>
              A <span className={'font-bold'}>Plus</span> or <span className={'font-bold'}>Pro</span> subscription plan
              is required to enable Cloud Backups.{' '}
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
            Configure the integrations below to enable automatic daily backups of your encrypted data set to your
            third-party cloud provider.
          </Text>
          <div>
            <HorizontalSeparator classes={`mt-3 mb-3 ${additionalClass}`} />
            <div>
              {providerData.map(({ name }) => (
                <Fragment key={name}>
                  <CloudBackupProvider
                    application={application}
                    providerName={name}
                    isEntitledToCloudBackups={isEntitledToCloudBackups}
                  />
                  <HorizontalSeparator classes={`mt-3 mb-3 ${additionalClass}`} />
                </Fragment>
              ))}
            </div>
          </div>

          <div className={additionalClass}>
            <Subtitle>Email preferences</Subtitle>
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
                  disabled={!isEntitledToCloudBackups}
                />
              )}
            </div>
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default CloudLink
