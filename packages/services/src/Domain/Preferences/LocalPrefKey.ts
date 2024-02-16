export enum LocalPrefKey {
  ActiveThemes = 'activeThemes',
  UseSystemColorScheme = 'useSystemColorScheme',
  UseTranslucentUI = 'useTranslucentUI',
  AutoLightThemeIdentifier = 'autoLightThemeIdentifier',
  AutoDarkThemeIdentifier = 'autoDarkThemeIdentifier',
}

export type LocalPrefValue = {
  [LocalPrefKey.ActiveThemes]: string[]
  [LocalPrefKey.UseSystemColorScheme]: boolean
  [LocalPrefKey.UseTranslucentUI]: boolean
  [LocalPrefKey.AutoLightThemeIdentifier]: string
  [LocalPrefKey.AutoDarkThemeIdentifier]: string
}
