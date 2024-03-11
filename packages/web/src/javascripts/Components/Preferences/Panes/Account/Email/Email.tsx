import {
  NativeFeatureIdentifier,
  FeatureStatus,
  MuteMarketingEmailsOption,
  MuteSignInEmailsOption,
  SettingName,
} from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'

import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Switch from '@/Components/Switch/Switch'
import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/WebApplication'
import { STRING_FAILED_TO_UPDATE_USER_SETTING } from '@/Constants/Strings'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import Spinner from '@/Components/Spinner/Spinner'
import NoProSubscription from '../NoProSubscription'

type Props = {
  application: WebApplication
}

const Email: FunctionComponent<Props> = ({ application }: Props) => {
  const [signInEmailsMutedValue, setSignInEmailsMutedValue] = useState(MuteSignInEmailsOption.NotMuted)
  const [marketingEmailsMutedValue, setMarketingEmailsMutedValue] = useState(MuteMarketingEmailsOption.NotMuted)
  const [isLoading, setIsLoading] = useState(true)

  const isMuteSignInEmailsFeatureAvailable =
    application.features.getFeatureStatus(
      NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.SignInAlerts).getValue(),
    ) === FeatureStatus.Entitled

  const updateSetting = async (settingName: SettingName, payload: string): Promise<boolean> => {
    try {
      await application.settings.updateSetting(settingName, payload, false)
      return true
    } catch (e) {
      application.alerts.alert(STRING_FAILED_TO_UPDATE_USER_SETTING).catch(console.error)
      return false
    }
  }

  const updateSubscriptionSetting = async (settingName: SettingName, payload: string): Promise<boolean> => {
    try {
      await application.settings.updateSubscriptionSetting(settingName, payload, false)
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
      setSignInEmailsMutedValue(
        userSettings.getSettingValue<MuteSignInEmailsOption>(
          SettingName.create(SettingName.NAMES.MuteSignInEmails).getValue(),
          MuteSignInEmailsOption.NotMuted,
        ),
      ),
        setMarketingEmailsMutedValue(
          userSettings.getSettingValue<MuteMarketingEmailsOption>(
            SettingName.create(SettingName.NAMES.MuteMarketingEmails).getValue(),
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

    const updateResult = await updateSubscriptionSetting(
      SettingName.create(SettingName.NAMES.MuteSignInEmails).getValue(),
      newValue,
    )

    if (!updateResult) {
      setSignInEmailsMutedValue(previousValue)
    }
  }

  const toggleMuteMarketingEmails = async () => {
    const previousValue = marketingEmailsMutedValue
    const newValue =
      previousValue === MuteMarketingEmailsOption.Muted
        ? MuteMarketingEmailsOption.NotMuted
        : MuteMarketingEmailsOption.Muted
    setMarketingEmailsMutedValue(newValue)

    const updateResult = await updateSetting(
      SettingName.create(SettingName.NAMES.MuteMarketingEmails).getValue(),
      newValue,
    )

    if (!updateResult) {
      setMarketingEmailsMutedValue(previousValue)
    }
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Email</Title>
        <div>
          <div className="flex items-start justify-between gap-2 md:items-center">
            <div className="flex flex-col">
              <Subtitle>Mute sign-in notification emails</Subtitle>
              {isMuteSignInEmailsFeatureAvailable ? (
                <Text>
                  Disables email notifications when a new sign-in occurs on your account. (Email notifications are
                  available only to paid subscribers).
                </Text>
              ) : (
                <NoProSubscription
                  application={application}
                  text={
                    <span>
                      Sign-in notification emails are available only on a{' '}
                      <span className="font-bold">subscription</span> plan. Please upgrade in order to enable sign-in
                      notifications.
                    </span>
                  }
                />
              )}
            </div>
            {isLoading ? (
              <Spinner className="h-5 w-5 flex-shrink-0" />
            ) : (
              isMuteSignInEmailsFeatureAvailable && (
                <Switch
                  onChange={toggleMuteSignInEmails}
                  checked={signInEmailsMutedValue === MuteSignInEmailsOption.Muted}
                />
              )
            )}
          </div>
          <HorizontalSeparator classes="my-4" />
          <div className="flex items-start justify-between gap-2 md:items-center">
            <div className="flex flex-col">
              <Subtitle>Mute marketing notification emails</Subtitle>
              <Text>Disables email notifications with special deals and promotions.</Text>
            </div>
            {isLoading ? (
              <Spinner className="h-5 w-5 flex-shrink-0" />
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
