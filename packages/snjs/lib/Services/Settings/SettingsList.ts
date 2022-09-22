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
  | OneDriveBackupFrequency

export class SettingsList {
  private map: Partial<Record<SettingName, SettingData>> = {}

  constructor(settings: SettingData[]) {
    for (const setting of settings) {
      this.map[setting.name as SettingName] = setting
    }
  }

  getSettingValue<T = SettingType, D = SettingType>(setting: SettingName, defaultValue: D): T {
    const settingData = this.map[setting]
    return (settingData?.value as unknown as T) || (defaultValue as unknown as T)
  }
}
