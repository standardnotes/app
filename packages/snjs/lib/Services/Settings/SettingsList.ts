import { SettingData } from '@standardnotes/responses'
import {
  OneDriveBackupFrequency,
  MuteSignInEmailsOption,
  MuteFailedCloudBackupsEmailsOption,
  MuteFailedBackupsEmailsOption,
  CloudProvider,
  DropboxBackupFrequency,
  EmailBackupFrequency,
  GoogleDriveBackupFrequency,
  ListedAuthorSecretsData,
  LogSessionUserAgentOption,
  SettingName,
  MuteMarketingEmailsOption,
} from '@standardnotes/settings'

type SettingType =
  | CloudProvider
  | DropboxBackupFrequency
  | EmailBackupFrequency
  | GoogleDriveBackupFrequency
  | ListedAuthorSecretsData
  | LogSessionUserAgentOption
  | MuteFailedBackupsEmailsOption
  | MuteFailedCloudBackupsEmailsOption
  | MuteSignInEmailsOption
  | MuteMarketingEmailsOption
  | OneDriveBackupFrequency

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
