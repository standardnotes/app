import { EditorFontSize, EditorLineHeight, EditorLineWidth } from '@standardnotes/models'
import { NativeFeatureIdentifier } from '@standardnotes/features'

export enum LocalPrefKey {
  ListPaneCollapsed = 'listPaneCollapsed',
  NavigationPaneCollapsed = 'navigationPaneCollapsed',
  ActiveThemes = 'activeThemes',
  UseSystemColorScheme = 'useSystemColorScheme',
  UseTranslucentUI = 'useTranslucentUI',
  AutoLightThemeIdentifier = 'autoLightThemeIdentifier',
  AutoDarkThemeIdentifier = 'autoDarkThemeIdentifier',

  EditorMonospaceEnabled = 'monospaceFont',
  EditorLineHeight = 'editorLineHeight',
  EditorLineWidth = 'editorLineWidth',
  EditorFontSize = 'editorFontSize',
}

export type LocalPrefValue = {
  [LocalPrefKey.ListPaneCollapsed]: boolean
  [LocalPrefKey.NavigationPaneCollapsed]: boolean
  [LocalPrefKey.ActiveThemes]: string[]
  [LocalPrefKey.UseSystemColorScheme]: boolean
  [LocalPrefKey.UseTranslucentUI]: boolean
  [LocalPrefKey.AutoLightThemeIdentifier]: string
  [LocalPrefKey.AutoDarkThemeIdentifier]: string

  [LocalPrefKey.EditorMonospaceEnabled]: boolean
  [LocalPrefKey.EditorLineHeight]: EditorLineHeight
  [LocalPrefKey.EditorLineWidth]: EditorLineWidth
  [LocalPrefKey.EditorFontSize]: EditorFontSize
}

export const LocalPrefDefaults = {
  [LocalPrefKey.ListPaneCollapsed]: false,
  [LocalPrefKey.NavigationPaneCollapsed]: false,
  [LocalPrefKey.ActiveThemes]: [],
  [LocalPrefKey.UseSystemColorScheme]: false,
  [LocalPrefKey.UseTranslucentUI]: true,
  [LocalPrefKey.AutoLightThemeIdentifier]: 'Default',
  [LocalPrefKey.AutoDarkThemeIdentifier]: NativeFeatureIdentifier.TYPES.DarkTheme,

  [LocalPrefKey.EditorMonospaceEnabled]: false,
  [LocalPrefKey.EditorLineHeight]: EditorLineHeight.Normal,
  [LocalPrefKey.EditorLineWidth]: EditorLineWidth.FullWidth,
  [LocalPrefKey.EditorFontSize]: EditorFontSize.Normal,
} satisfies {
  [key in LocalPrefKey]: LocalPrefValue[key]
}
