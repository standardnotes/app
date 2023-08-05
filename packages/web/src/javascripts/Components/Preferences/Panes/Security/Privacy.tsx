import Switch from '@/Components/Switch/Switch'
import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/WebApplication'
import { LogSessionUserAgentOption, SettingName } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import { STRING_FAILED_TO_UPDATE_USER_SETTING } from '@/Constants/Strings'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import Spinner from '@/Components/Spinner/Spinner'

type Props = {
  application: WebApplication
}

const Privacy: FunctionComponent<Props> = ({ application }: Props) => {
  const [sessionUaLoggingValue, setSessionUaLoggingValue] = useState<LogSessionUserAgentOption>(
    LogSessionUserAgentOption.Enabled,
  )
  const [isLoading, setIsLoading] = useState(true)

  const updateSetting = async (settingName: SettingName, payload: string): Promise<boolean> => {
    try {
      await application.settings.updateSetting(settingName, payload, false)
      return true
    } catch (e) {
      application.alerts.alert(STRING_FAILED_TO_UPDATE_USER_SETTING).catch(console.error)
      return false
    }
  }

  const loadSettings = useCallback(async () => {
    if (!application.sessions.getUser()) {
      return
    }
    setIsLoading(true)

    try {
      const userSettings = await application.settings.listSettings()
      setSessionUaLoggingValue(
        userSettings.getSettingValue<LogSessionUserAgentOption>(
          SettingName.create(SettingName.NAMES.LogSessionUserAgent).getValue(),
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

  const toggleSessionLogging = async () => {
    const previousValue = sessionUaLoggingValue
    const newValue =
      previousValue === LogSessionUserAgentOption.Enabled
        ? LogSessionUserAgentOption.Disabled
        : LogSessionUserAgentOption.Enabled
    setSessionUaLoggingValue(newValue)

    const updateResult = await updateSetting(
      SettingName.create(SettingName.NAMES.LogSessionUserAgent).getValue(),
      newValue,
    )

    if (!updateResult) {
      setSessionUaLoggingValue(previousValue)
    }
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Privacy</Title>
        <div>
          <div className="flex justify-between gap-2 md:items-center">
            <div className="flex flex-col">
              <Subtitle>Session user agent logging</Subtitle>
              <Text>
                User agent logging allows you to identify the devices or browsers signed into your account. For
                increased privacy, you can disable this feature, which will remove all saved user agent values from our
                server, and disable future logging of this value.
              </Text>
            </div>
            {isLoading ? (
              <Spinner className="h-5 w-5 flex-shrink-0" />
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
