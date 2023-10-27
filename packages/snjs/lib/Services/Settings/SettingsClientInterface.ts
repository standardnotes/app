import { EmailBackupFrequency } from '@standardnotes/settings'
import { SettingsList } from './SettingsList'
import { SettingName } from '@standardnotes/domain-core'

export interface SettingsClientInterface {
  listSettings(): Promise<SettingsList>

  getSetting(name: SettingName): Promise<string | undefined>

  getDoesSensitiveSettingExist(name: SettingName): Promise<boolean>

  updateSetting(name: SettingName, payload: string, sensitive?: boolean): Promise<void>

  deleteSetting(name: SettingName): Promise<void>

  getEmailBackupFrequencyOptionLabel(frequency: EmailBackupFrequency): string
}
