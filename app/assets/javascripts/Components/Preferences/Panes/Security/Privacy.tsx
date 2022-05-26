import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Switch from '@/Components/Switch/Switch'
import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/UIModels/Application'
import { MuteSignInEmailsOption, LogSessionUserAgentOption, SettingName } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import { STRING_FAILED_TO_UPDATE_USER_SETTING } from '@/Strings'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

type Props = {
  application: WebApplication
}

const Privacy: FunctionComponent<Props> = ({ application }: Props) => {
  const [signInEmailsMutedValue, setSignInEmailsMutedValue] = useState<MuteSignInEmailsOption>(
    MuteSignInEmailsOption.NotMuted,
  )
  const [sessionUaLoggingValue, setSessionUaLoggingValue] = useState<LogSessionUserAgentOption>(
    LogSessionUserAgentOption.Enabled,
  )
  const [isLoading, setIsLoading] = useState(false)

  const updateSetting = async (settingName: SettingName, payload: string): Promise<boolean> => {
    try {
      await application.settings.updateSetting(settingName, payload, false)
      return true
    } catch (e) {
      application.alertService.alert(STRING_FAILED_TO_UPDATE_USER_SETTING).catch(console.error)
      return false
    }
  }

  const loadSettings = useCallback(async () => {
    if (!application.getUser()) {
      return
    }
    setIsLoading(true)

    try {
      const userSettings = await application.settings.listSettings()
      setSignInEmailsMutedValue(
        userSettings.getSettingValue<MuteSignInEmailsOption>(
          SettingName.MuteSignInEmails,
          MuteSignInEmailsOption.NotMuted,
        ),
      )
      setSessionUaLoggingValue(
        userSettings.getSettingValue<LogSessionUserAgentOption>(
          SettingName.LogSessionUserAgent,
          LogSessionUserAgentOption.Enabled,
        ),
      )
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [application])

  useEffect(() => {
    loadSettings().catch(console.error)
  }, [loadSettings])

  const toggleMuteSignInEmails = async () => {
    const previousValue = signInEmailsMutedValue
    const newValue =
      previousValue === MuteSignInEmailsOption.Muted ? MuteSignInEmailsOption.NotMuted : MuteSignInEmailsOption.Muted
    setSignInEmailsMutedValue(newValue)

    const updateResult = await updateSetting(SettingName.MuteSignInEmails, newValue)

    if (!updateResult) {
      setSignInEmailsMutedValue(previousValue)
    }
  }

  const toggleSessionLogging = async () => {
    const previousValue = sessionUaLoggingValue
    const newValue =
      previousValue === LogSessionUserAgentOption.Enabled
        ? LogSessionUserAgentOption.Disabled
        : LogSessionUserAgentOption.Enabled
    setSessionUaLoggingValue(newValue)

    const updateResult = await updateSetting(SettingName.LogSessionUserAgent, newValue)

    if (!updateResult) {
      setSessionUaLoggingValue(previousValue)
    }
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Privacy</Title>
        <div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Subtitle>Disable sign-in notification emails</Subtitle>
              <Text>
                Disables email notifications when a new sign-in occurs on your account. (Email notifications are
                available to paid subscribers).
              </Text>
            </div>
            {isLoading ? (
              <div className={'sk-spinner info small'} />
            ) : (
              <Switch
                onChange={toggleMuteSignInEmails}
                checked={signInEmailsMutedValue === MuteSignInEmailsOption.Muted}
              />
            )}
          </div>
          <HorizontalSeparator classes="my-4" />
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Subtitle>Session user agent logging</Subtitle>
              <Text>
                User agent logging allows you to identify the devices or browsers signed into your account. For
                increased privacy, you can disable this feature, which will remove all saved user agent values from our
                server, and disable future logging of this value.
              </Text>
            </div>
            {isLoading ? (
              <div className={'sk-spinner info small'} />
            ) : (
              <Switch
                onChange={toggleSessionLogging}
                checked={sessionUaLoggingValue === LogSessionUserAgentOption.Enabled}
              />
            )}
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(Privacy)
