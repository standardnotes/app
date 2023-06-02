import { Language } from '../SpellcheckerManager'

export enum StoreKeys {
  ExtServerHost = 'extServerHost',
  UseSystemMenuBar = 'useSystemMenuBar',
  MenuBarVisible = 'isMenuBarVisible',
  MinimizeToTray = 'minimizeToTray',
  EnableAutoUpdate = 'enableAutoUpdates',
  ZoomFactor = 'zoomFactor',
  SelectedSpellCheckerLanguageCodes = 'selectedSpellCheckerLanguageCodes',
  UseNativeKeychain = 'useNativeKeychain',
  LastRunVersion = 'LastRunVersion',

  DesktopServerAuthJWTSecret = 'DesktopServerAuthJWTSecret',
  DesktopServerDataLocation = 'DesktopServerDataLocation',
  DesktopServerEncryptionServerKey = 'DesktopServerEncryptionServerKey',
  DesktopServerJWTSecret = 'DesktopServerJWTSecret',
  DesktopServerPseudoKeyParamsKey = 'DesktopServerPseudoKeyParamsKey',
  DesktopServerValetTokenSecret = 'DesktopServerValetTokenSecret',
  DesktopServerPort = 'DesktopServerPort',

  LegacyTextBackupsLocation = 'backupsLocation',
  LegacyTextBackupsDisabled = 'backupsDisabled',

  LegacyFileBackupsEnabled = 'fileBackupsEnabled',
  LegacyFileBackupsLocation = 'fileBackupsLocation',
}

export interface StoreData {
  [StoreKeys.ExtServerHost]: string
  [StoreKeys.UseSystemMenuBar]: boolean
  [StoreKeys.MenuBarVisible]: boolean
  [StoreKeys.MinimizeToTray]: boolean
  [StoreKeys.EnableAutoUpdate]: boolean
  [StoreKeys.UseNativeKeychain]: boolean | null
  [StoreKeys.ZoomFactor]: number
  [StoreKeys.SelectedSpellCheckerLanguageCodes]: Set<Language> | null
  [StoreKeys.LastRunVersion]: string

  [StoreKeys.DesktopServerAuthJWTSecret]: string
  [StoreKeys.DesktopServerDataLocation]: string
  [StoreKeys.DesktopServerEncryptionServerKey]: string
  [StoreKeys.DesktopServerJWTSecret]: string
  [StoreKeys.DesktopServerPseudoKeyParamsKey]: string
  [StoreKeys.DesktopServerValetTokenSecret]: string
  [StoreKeys.DesktopServerPort]: number

  [StoreKeys.LegacyTextBackupsLocation]: string
  [StoreKeys.LegacyTextBackupsDisabled]: boolean

  [StoreKeys.LegacyFileBackupsEnabled]: boolean
  [StoreKeys.LegacyFileBackupsLocation]: string
}
