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

  HomeServerAuthJWTSecret = 'HomeServerAuthJWTSecret',
  HomeServerDataLocation = 'HomeServerDataLocation',
  HomeServerEncryptionServerKey = 'HomeServerEncryptionServerKey',
  HomeServerJWTSecret = 'HomeServerJWTSecret',
  HomeServerPseudoKeyParamsKey = 'HomeServerPseudoKeyParamsKey',
  HomeServerValetTokenSecret = 'HomeServerValetTokenSecret',
  HomeServerPort = 'HomeServerPort',

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

  [StoreKeys.HomeServerAuthJWTSecret]: string
  [StoreKeys.HomeServerDataLocation]: string
  [StoreKeys.HomeServerEncryptionServerKey]: string
  [StoreKeys.HomeServerJWTSecret]: string
  [StoreKeys.HomeServerPseudoKeyParamsKey]: string
  [StoreKeys.HomeServerValetTokenSecret]: string
  [StoreKeys.HomeServerPort]: number

  [StoreKeys.LegacyTextBackupsLocation]: string
  [StoreKeys.LegacyTextBackupsDisabled]: boolean

  [StoreKeys.LegacyFileBackupsEnabled]: boolean
  [StoreKeys.LegacyFileBackupsLocation]: string
}
