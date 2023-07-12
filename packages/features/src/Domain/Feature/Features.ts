import { AnyFeatureDescription } from './AnyFeatureDescription'
import { ThemeFeatureDescription } from './ThemeFeatureDescription'
import { EditorFeatureDescription } from './EditorFeatureDescription'
import { FeatureIdentifier } from './FeatureIdentifier'
import { serverFeatures } from '../Lists/ServerFeatures'
import { clientFeatures } from '../Lists/ClientFeatures'
import { GetDeprecatedFeatures } from '../Lists/DeprecatedFeatures'
import { experimentalFeatures } from '../Lists/ExperimentalFeatures'
import { IframeEditors } from '../Lists/IframeEditors'
import { themes } from '../Lists/Themes'
import { nativeEditors } from '../Lists/NativeEditors'

export function GetFeatures(): AnyFeatureDescription[] {
  return [
    ...serverFeatures(),
    ...clientFeatures(),
    ...themes(),
    ...nativeEditors(),
    ...IframeEditors(),
    ...experimentalFeatures(),
    ...GetDeprecatedFeatures(),
  ]
}

export function FindNativeFeature<T extends AnyFeatureDescription>(identifier: FeatureIdentifier): T | undefined {
  return GetFeatures().find((f) => f.identifier === identifier) as T
}

export function FindNativeTheme(identifier: FeatureIdentifier): ThemeFeatureDescription | undefined {
  return themes().find((t) => t.identifier === identifier)
}

export function GetIframeAndNativeEditors(): EditorFeatureDescription[] {
  return [...IframeEditors(), ...nativeEditors()]
}

export function GetSuperNoteFeature(): EditorFeatureDescription {
  return FindNativeFeature(FeatureIdentifier.SuperEditor) as EditorFeatureDescription
}

export function GetPlainNoteFeature(): EditorFeatureDescription {
  return FindNativeFeature(FeatureIdentifier.PlainEditor) as EditorFeatureDescription
}

export function GetNativeThemes(): ThemeFeatureDescription[] {
  return themes()
}

export function GetDarkThemeFeature(): ThemeFeatureDescription {
  return themes().find((t) => t.identifier === FeatureIdentifier.DarkTheme) as ThemeFeatureDescription
}
