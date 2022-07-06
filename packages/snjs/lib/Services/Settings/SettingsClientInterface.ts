import { SettingName, SensitiveSettingName, EmailBackupFrequency } from '@standardnotes/settings'
import { SettingsList } from './SettingsList'

export interface SettingsClientInterface {
  listSettings(): Promise<SettingsList>

  getSetting(name: SettingName): Promise<string | undefined>

  getDoesSensitiveSettingExist(name: SensitiveSettingName): Promise<boolean>

  updateSetting(name: SettingName, payload: string, sensitive?: boolean): Promise<void>

  deleteSetting(name: SettingName): Promise<void>

  getEmailBackupFrequencyOptionLabel(frequency: EmailBackupFrequency): string
}
