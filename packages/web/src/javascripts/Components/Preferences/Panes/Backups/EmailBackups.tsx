import { convertStringifiedBooleanToBoolean, isDesktopApplication } from '@/Utils'
import { STRING_FAILED_TO_UPDATE_USER_SETTING } from '@/Constants/Strings'
import { useCallback, useEffect, useState } from 'react'
import { WebApplication } from '@/Application/WebApplication'
import { observer } from 'mobx-react-lite'
import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import Dropdown from '@/Components/Dropdown/Dropdown'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import Switch from '@/Components/Switch/Switch'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { EmailBackupFrequency, MuteFailedBackupsEmailsOption, SettingName } from '@standardnotes/snjs'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import Spinner from '@/Components/Spinner/Spinner'

type Props = {
  application: WebApplication
}

const EmailBackups = ({ application }: Props) => {
  const [isLoading, setIsLoading] = useState(false)
  const [emailFrequency, setEmailFrequency] = useState<EmailBackupFrequency>(EmailBackupFrequency.Disabled)
  const [emailFrequencyOptions, setEmailFrequencyOptions] = useState<DropdownItem[]>([])
  const [isFailedBackupEmailMuted, setIsFailedBackupEmailMuted] = useState(true)
  const hasAccount = application.hasAccount()

  const loadEmailFrequencySetting = useCallback(async () => {
    if (!application.getUser()) {
      return
    }
    setIsLoading(true)

    try {
      const userSettings = await application.settings.listSettings()
      setEmailFrequency(
        userSettings.getSettingValue<EmailBackupFrequency>(
          SettingName.create(SettingName.NAMES.EmailBackupFrequency).getValue(),
          EmailBackupFrequency.Disabled,
        ),
      )
      setIsFailedBackupEmailMuted(
        convertStringifiedBooleanToBoolean(
          userSettings.getSettingValue<MuteFailedBackupsEmailsOption>(
            SettingName.create(SettingName.NAMES.MuteFailedBackupsEmails).getValue(),
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

    const updateResult = await updateSetting(
      SettingName.create(SettingName.NAMES.EmailBackupFrequency).getValue(),
      frequency,
    )
    if (!updateResult) {
      setEmailFrequency(previousFrequency)
    }
  }

  const toggleMuteFailedBackupEmails = async () => {
    const previousValue = isFailedBackupEmailMuted
    setIsFailedBackupEmailMuted(!isFailedBackupEmailMuted)

    const updateResult = await updateSetting(
      SettingName.create(SettingName.NAMES.MuteFailedBackupsEmails).getValue(),
      `${!isFailedBackupEmailMuted}`,
    )
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
        <Title>Email backups</Title>
        {!isDesktopApplication() && (
          <Text className="mb-3">
            Receive daily encrypted email backups of all your notes directly in your email inbox.
          </Text>
        )}

        <div className={`${!hasAccount ? 'pointer-events-none cursor-default opacity-50' : ''}`}>
          <Subtitle>Frequency</Subtitle>
          <Text>How often to receive backups.</Text>
          <div className="mt-2">
            {isLoading ? (
              <Spinner className="h-5 w-5 flex-shrink-0" />
            ) : (
              <Dropdown
                label="Select email frequency"
                items={emailFrequencyOptions}
                value={emailFrequency}
                onChange={handleEmailFrequencyChange}
              />
            )}
          </div>
          <HorizontalSeparator classes="my-4" />
          <Subtitle>Email preferences</Subtitle>
          <div className="flex justify-between gap-2 md:items-center">
            <div className="flex flex-col">
              <Text>Receive a notification email if an email backup fails.</Text>
            </div>
            {isLoading ? (
              <Spinner className="h-5 w-5 flex-shrink-0" />
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
