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

  TextBackupsLocation = 'backupsLocation',
  TextBackupsDisabled = 'backupsDisabled',

  FileBackupsEnabled = 'fileBackupsEnabled',
  FileBackupsLocation = 'fileBackupsLocation',

  PlaintextBackupsEnabled = 'plaintextBackupsEnabled',
  PlaintextBackupsLocation = 'plaintextBackupsLocation',
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

  [StoreKeys.TextBackupsLocation]: string
  [StoreKeys.TextBackupsDisabled]: boolean

  [StoreKeys.FileBackupsEnabled]: boolean
  [StoreKeys.FileBackupsLocation]: string

  [StoreKeys.PlaintextBackupsEnabled]: boolean
  [StoreKeys.PlaintextBackupsLocation]: string
}
