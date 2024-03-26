import { SettingName } from '@standardnotes/domain-core'
import { SettingData } from '@standardnotes/responses'
import {
  MuteSignInEmailsOption,
  EmailBackupFrequency,
  ListedAuthorSecretsData,
  LogSessionUserAgentOption,
  MuteMarketingEmailsOption,
} from '@standardnotes/settings'

type SettingType =
  | EmailBackupFrequency
  | ListedAuthorSecretsData
  | LogSessionUserAgentOption
  | MuteSignInEmailsOption
  | MuteMarketingEmailsOption

export class SettingsList {
  private map: Partial<Record<string, SettingData>> = {}

  constructor(settings: SettingData[]) {
    for (const setting of settings) {
      this.map[setting.name] = setting
    }
  }

  getSettingValue<T = SettingType, D = SettingType>(settingName: SettingName, defaultValue: D): T {
    const settingData = this.map[settingName.value]
    return (settingData?.value as unknown as T) || (defaultValue as unknown as T)
  }
}
