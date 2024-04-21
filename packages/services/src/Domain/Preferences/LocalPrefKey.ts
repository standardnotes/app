import { AutoDownloadLimit, PrefDefaults } from '@standardnotes/models'

export enum LocalPrefKey {
  ActiveThemes = 'activeThemes',
  UseSystemColorScheme = 'useSystemColorScheme',
  UseTranslucentUI = 'useTranslucentUI',
  AutoLightThemeIdentifier = 'autoLightThemeIdentifier',
  AutoDarkThemeIdentifier = 'autoDarkThemeIdentifier',

  AlwaysAutoDownloadSuperEmbeds = 'alwaysAutoDownloadSuperEmbeds',
  SuperEmbedAutoDownloadLimit = 'superEmbedAutoDownloadLimit',
}

export type LocalPrefValue = {
  [LocalPrefKey.ActiveThemes]: string[]
  [LocalPrefKey.UseSystemColorScheme]: boolean
  [LocalPrefKey.UseTranslucentUI]: boolean
  [LocalPrefKey.AutoLightThemeIdentifier]: string
  [LocalPrefKey.AutoDarkThemeIdentifier]: string

  [LocalPrefKey.AlwaysAutoDownloadSuperEmbeds]: boolean
  [LocalPrefKey.SuperEmbedAutoDownloadLimit]: AutoDownloadLimit
}

export const LocalPrefDefaults = {
  [LocalPrefKey.ActiveThemes]: PrefDefaults[LocalPrefKey.ActiveThemes],
  [LocalPrefKey.UseSystemColorScheme]: PrefDefaults[LocalPrefKey.UseSystemColorScheme],
  [LocalPrefKey.UseTranslucentUI]: PrefDefaults[LocalPrefKey.UseTranslucentUI],
  [LocalPrefKey.AutoLightThemeIdentifier]: PrefDefaults[LocalPrefKey.AutoLightThemeIdentifier],
  [LocalPrefKey.AutoDarkThemeIdentifier]: PrefDefaults[LocalPrefKey.AutoDarkThemeIdentifier],

  [LocalPrefKey.AlwaysAutoDownloadSuperEmbeds]: false,
  [LocalPrefKey.SuperEmbedAutoDownloadLimit]: AutoDownloadLimit.FiveMB,
} satisfies {
  [key in LocalPrefKey]: LocalPrefValue[key]
}
