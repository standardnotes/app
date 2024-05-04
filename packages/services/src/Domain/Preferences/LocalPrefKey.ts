import {
  AutoDownloadLimit,
  PrefDefaults,
  EditorFontSize,
  EditorLineHeight,
  EditorLineWidth,
} from '@standardnotes/models'

export enum LocalPrefKey {
  ActiveThemes = 'activeThemes',
  UseSystemColorScheme = 'useSystemColorScheme',
  UseTranslucentUI = 'useTranslucentUI',
  AutoLightThemeIdentifier = 'autoLightThemeIdentifier',
  AutoDarkThemeIdentifier = 'autoDarkThemeIdentifier',

  AlwaysAutoDownloadSuperEmbeds = 'alwaysAutoDownloadSuperEmbeds',
  SuperEmbedAutoDownloadLimit = 'superEmbedAutoDownloadLimit',

  EditorMonospaceEnabled = 'monospaceFont',
  EditorLineHeight = 'editorLineHeight',
  EditorLineWidth = 'editorLineWidth',
  EditorFontSize = 'editorFontSize',
}

export type LocalPrefValue = {
  [LocalPrefKey.ActiveThemes]: string[]
  [LocalPrefKey.UseSystemColorScheme]: boolean
  [LocalPrefKey.UseTranslucentUI]: boolean
  [LocalPrefKey.AutoLightThemeIdentifier]: string
  [LocalPrefKey.AutoDarkThemeIdentifier]: string

  [LocalPrefKey.AlwaysAutoDownloadSuperEmbeds]: boolean
  [LocalPrefKey.SuperEmbedAutoDownloadLimit]: AutoDownloadLimit

  [LocalPrefKey.EditorMonospaceEnabled]: boolean
  [LocalPrefKey.EditorLineHeight]: EditorLineHeight
  [LocalPrefKey.EditorLineWidth]: EditorLineWidth
  [LocalPrefKey.EditorFontSize]: EditorFontSize
}

export const LocalPrefDefaults = {
  [LocalPrefKey.ActiveThemes]: PrefDefaults[LocalPrefKey.ActiveThemes],
  [LocalPrefKey.UseSystemColorScheme]: PrefDefaults[LocalPrefKey.UseSystemColorScheme],
  [LocalPrefKey.UseTranslucentUI]: PrefDefaults[LocalPrefKey.UseTranslucentUI],
  [LocalPrefKey.AutoLightThemeIdentifier]: PrefDefaults[LocalPrefKey.AutoLightThemeIdentifier],
  [LocalPrefKey.AutoDarkThemeIdentifier]: PrefDefaults[LocalPrefKey.AutoDarkThemeIdentifier],

  [LocalPrefKey.AlwaysAutoDownloadSuperEmbeds]: false,
  [LocalPrefKey.SuperEmbedAutoDownloadLimit]: AutoDownloadLimit.FiveMB,

  [LocalPrefKey.EditorMonospaceEnabled]: PrefDefaults[LocalPrefKey.EditorMonospaceEnabled],
  [LocalPrefKey.EditorLineHeight]: PrefDefaults[LocalPrefKey.EditorLineHeight],
  [LocalPrefKey.EditorLineWidth]: PrefDefaults[LocalPrefKey.EditorLineWidth],
  [LocalPrefKey.EditorFontSize]: PrefDefaults[LocalPrefKey.EditorFontSize],
} satisfies {
  [key in LocalPrefKey]: LocalPrefValue[key]
}
