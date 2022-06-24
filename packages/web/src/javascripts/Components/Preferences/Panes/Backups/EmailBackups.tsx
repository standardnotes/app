import { convertStringifiedBooleanToBoolean, isDesktopApplication } from '@/Utils'
import { STRING_FAILED_TO_UPDATE_USER_SETTING } from '@/Constants/Strings'
import { useCallback, useEffect, useState } from 'react'
import { WebApplication } from '@/Application/Application'
import { observer } from 'mobx-react-lite'
import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import Dropdown from '@/Components/Dropdown/Dropdown'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import Switch from '@/Components/Switch/Switch'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { EmailBackupFrequency, MuteFailedBackupsEmailsOption, SettingName } from '@standardnotes/snjs'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

type Props = {
  application: WebApplication
}

const EmailBackups = ({ application }: Props) => {
  const [isLoading, setIsLoading] = useState(false)
  const [emailFrequency, setEmailFrequency] = useState<EmailBackupFrequency>(EmailBackupFrequency.Disabled)
  const [emailFrequencyOptions, setEmailFrequencyOptions] = useState<DropdownItem[]>([])
  const [isFailedBackupEmailMuted, setIsFailedBackupEmailMuted] = useState(true)

  const loadEmailFrequencySetting = useCallback(async () => {
    if (!application.getUser()) {
      return
    }
    setIsLoading(true)

    try {
      const userSettings = await application.settings.listSettings()
      setEmailFrequency(
        userSettings.getSettingValue<EmailBackupFrequency>(
          SettingName.EmailBackupFrequency,
          EmailBackupFrequency.Disabled,
        ),
      )
      setIsFailedBackupEmailMuted(
        convertStringifiedBooleanToBoolean(
          userSettings.getSettingValue<MuteFailedBackupsEmailsOption>(
            SettingName.MuteFailedBackupsEmails,
            MuteFailedBackupsEmailsOption.NotMuted,
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
    const frequencyOptions = []
    for (const frequency in EmailBackupFrequency) {
      const frequencyValue = EmailBackupFrequency[frequency as keyof typeof EmailBackupFrequency]
      frequencyOptions.push({
        value: frequencyValue,
        label: application.settings.getEmailBackupFrequencyOptionLabel(frequencyValue),
      })
    }
    setEmailFrequencyOptions(frequencyOptions)

    loadEmailFrequencySetting().catch(console.error)
  }, [application, loadEmailFrequencySetting])

  const updateSetting = async (settingName: SettingName, payload: string): Promise<boolean> => {
    try {
      await application.settings.updateSetting(settingName, payload, false)
      return true
    } catch (e) {
      application.alertService.alert(STRING_FAILED_TO_UPDATE_USER_SETTING).catch(console.error)
      return false
    }
  }

  const updateEmailFrequency = async (frequency: EmailBackupFrequency) => {
    const previousFrequency = emailFrequency
    setEmailFrequency(frequency)

    const updateResult = await updateSetting(SettingName.EmailBackupFrequency, frequency)
    if (!updateResult) {
      setEmailFrequency(previousFrequency)
    }
  }

  const toggleMuteFailedBackupEmails = async () => {
    const previousValue = isFailedBackupEmailMuted
    setIsFailedBackupEmailMuted(!isFailedBackupEmailMuted)

    const updateResult = await updateSetting(SettingName.MuteFailedBackupsEmails, `${!isFailedBackupEmailMuted}`)
    if (!updateResult) {
      setIsFailedBackupEmailMuted(previousValue)
    }
  }

  const handleEmailFrequencyChange = (item: string) => {
    updateEmailFrequency(item as EmailBackupFrequency).catch(console.error)
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Email Backups</Title>
        <div>
          {!isDesktopApplication() && (
            <Text className="mb-3">
              Daily encrypted email backups of your entire data set delivered directly to your inbox.
            </Text>
          )}
          <Subtitle>Email frequency</Subtitle>
          <Text>How often to receive backups.</Text>
          <div className="mt-2">
            {isLoading ? (
              <div
                className={'animate-spin border border-solid border-info border-r-transparent rounded-full info small'}
              />
            ) : (
              <Dropdown
                id="def-editor-dropdown"
                label="Select email frequency"
                items={emailFrequencyOptions}
                value={emailFrequency}
                onChange={handleEmailFrequencyChange}
              />
            )}
          </div>
          <HorizontalSeparator classes="my-4" />
          <Subtitle>Email preferences</Subtitle>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Text>Receive a notification email if an email backup fails.</Text>
            </div>
            {isLoading ? (
              <div
                className={'animate-spin border border-solid border-info border-r-transparent rounded-full info small'}
              />
            ) : (
              <Switch onChange={toggleMuteFailedBackupEmails} checked={!isFailedBackupEmailMuted} />
            )}
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(EmailBackups)
