import { EditorFeatureDescription, FeatureDescription, ThemeFeatureDescription } from './FeatureDescription'
import { FeatureIdentifier } from './FeatureIdentifier'
import { serverFeatures } from '../Lists/ServerFeatures'
import { clientFeatures } from '../Lists/ClientFeatures'
import { GetDeprecatedFeatures } from '../Lists/DeprecatedFeatures'
import { experimentalFeatures } from '../Lists/ExperimentalFeatures'
import { editors } from '../Lists/Editors'
import { themes } from '../Lists/Themes'

export function GetFeatures(): FeatureDescription[] {
  return [...serverFeatures(), ...clientFeatures(), ...experimentalFeatures(), ...GetDeprecatedFeatures()]
}

export function FindNativeFeature<T extends FeatureDescription>(identifier: FeatureIdentifier): T | undefined {
  return GetFeatures().find((f) => f.identifier === identifier) as T
}

export function GetNativeEditors(): EditorFeatureDescription[] {
  return editors()
}

export function GetDarkThemeFeature(): ThemeFeatureDescription {
  return themes().find((t) => t.identifier === FeatureIdentifier.DarkTheme) as ThemeFeatureDescription
}
