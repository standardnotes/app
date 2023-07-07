import { EditorFeatureDescription, FeatureDescription } from './FeatureDescription'
import { FeatureIdentifier } from './FeatureIdentifier'
import { serverFeatures } from '../Lists/ServerFeatures'
import { clientFeatures } from '../Lists/ClientFeatures'
import { GetDeprecatedFeatures } from '../Lists/DeprecatedFeatures'
import { experimentalFeatures } from '../Lists/ExperimentalFeatures'
import { editors } from '../Lists/Editors'

export function GetFeatures(): FeatureDescription[] {
  return [...serverFeatures(), ...clientFeatures(), ...experimentalFeatures(), ...GetDeprecatedFeatures()]
}

export function FindNativeFeature(identifier: FeatureIdentifier): FeatureDescription | undefined {
  return GetFeatures().find((f) => f.identifier === identifier)
}

export function GetNativeEditors(): EditorFeatureDescription[] {
  return editors()
}
