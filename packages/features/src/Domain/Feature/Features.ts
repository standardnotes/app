import { AnyFeatureDescription } from './AnyFeatureDescription'
import { ThemeFeatureDescription } from './ThemeFeatureDescription'
import { EditorFeatureDescription } from './EditorFeatureDescription'
import { NativeFeatureIdentifier } from './NativeFeatureIdentifier'
import { serverFeatures } from '../Lists/ServerFeatures'
import { clientFeatures } from '../Lists/ClientFeatures'
import { GetDeprecatedFeatures } from '../Lists/DeprecatedFeatures'
import { experimentalFeatures } from '../Lists/ExperimentalFeatures'
import { IframeEditors } from '../Lists/IframeEditors'
import { themes } from '../Lists/Themes'
import { nativeEditors } from '../Lists/NativeEditors'
import { IframeComponentFeatureDescription } from './IframeComponentFeatureDescription'
import { ComponentArea } from '../Component/ComponentArea'

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

export function FindNativeFeature<T extends AnyFeatureDescription>(identifier: string): T | undefined {
  return GetFeatures().find((f) => f.identifier === identifier) as T
}

export function FindNativeTheme(identifier: string): ThemeFeatureDescription | undefined {
  return themes().find((t) => t.identifier === identifier)
}

export function GetIframeAndNativeEditors(): (IframeComponentFeatureDescription | EditorFeatureDescription)[] {
  return [...IframeEditors(), ...nativeEditors()]
}

export function GetIframeEditors(): IframeComponentFeatureDescription[] {
  return IframeEditors()
}

export function GetSuperNoteFeature(): EditorFeatureDescription {
  return FindNativeFeature(NativeFeatureIdentifier.TYPES.SuperEditor) as EditorFeatureDescription
}

export function GetPlainNoteFeature(): EditorFeatureDescription {
  return FindNativeFeature(NativeFeatureIdentifier.TYPES.PlainEditor) as EditorFeatureDescription
}

export function GetNativeThemes(): ThemeFeatureDescription[] {
  return themes()
}

export function GetDarkThemeFeature(): ThemeFeatureDescription {
  return themes().find((t) => t.identifier === NativeFeatureIdentifier.TYPES.DarkTheme) as ThemeFeatureDescription
}

export function GetDeprecatedEditors(): IframeComponentFeatureDescription[] {
  return (GetDeprecatedFeatures() as IframeComponentFeatureDescription[]).filter((f) => f.area === ComponentArea.Editor)
}
