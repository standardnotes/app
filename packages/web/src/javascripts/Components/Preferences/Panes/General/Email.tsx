import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Switch from '@/Components/Switch/Switch'
import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/Application'
import { MuteMarketingEmailsOption, MuteSignInEmailsOption, SettingName } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import { STRING_FAILED_TO_UPDATE_USER_SETTING } from '@/Constants/Strings'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import Spinner from '@/Components/Spinner/Spinner'

type Props = {
  application: WebApplication
}

const Email: FunctionComponent<Props> = ({ application }: Props) => {
  const [signInEmailsMutedValue, setSignInEmailsMutedValue] = useState(
    MuteSignInEmailsOption.NotMuted,
  )
  const [marketingEmailsMutedValue, setMarketingEmailsMutedValue] = useState(
    MuteMarketingEmailsOption.NotMuted,
  )
  const [isLoading, setIsLoading] = useState(true)

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
      ),
      setMarketingEmailsMutedValue(
        userSettings.getSettingValue<MuteMarketingEmailsOption>(
          SettingName.MuteMarketingEmails,
          MuteMarketingEmailsOption.NotMuted,
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

  const toggleMuteMarketingEmails = async () => {
    const previousValue = marketingEmailsMutedValue
    const newValue =
      previousValue === MuteMarketingEmailsOption.Muted ? MuteMarketingEmailsOption.NotMuted : MuteMarketingEmailsOption.Muted
    setMarketingEmailsMutedValue(newValue)

    const updateResult = await updateSetting(SettingName.MuteMarketingEmails, newValue)

    if (!updateResult) {
      setMarketingEmailsMutedValue(previousValue)
    }
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Email</Title>
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
              <Spinner className="ml-2 flex-shrink-0" />
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
              <Subtitle>Disable marketing notification emails</Subtitle>
              <Text>
                Disables email notifications with special deals and promotions.
              </Text>
            </div>
            {isLoading ? (
              <Spinner className="ml-2 flex-shrink-0" />
            ) : (
              <Switch
                onChange={toggleMuteMarketingEmails}
                checked={marketingEmailsMutedValue === MuteMarketingEmailsOption.Muted}
              />
            )}
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(Email)
