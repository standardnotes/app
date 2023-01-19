import { FeatureDescription } from './FeatureDescription'
import { FeatureIdentifier } from './FeatureIdentifier'
import { serverFeatures } from '../Lists/ServerFeatures'
import { clientFeatures } from '../Lists/ClientFeatures'
import { GetDeprecatedFeatures } from '../Lists/DeprecatedFeatures'
import { experimentalFeatures } from '../Lists/ExperimentalFeatures'
import { SubscriptionName } from '@standardnotes/common'

export function GetFeatures(): FeatureDescription[] {
  return [...serverFeatures(), ...clientFeatures(), ...experimentalFeatures(), ...GetDeprecatedFeatures()]
}

export function GetFeaturesForSubscription(subscription: SubscriptionName): FeatureDescription[] {
  return GetFeatures().filter((feature) => feature.availableInSubscriptions.includes(subscription))
}

export function FindNativeFeature(identifier: FeatureIdentifier): FeatureDescription | undefined {
  return GetFeatures().find((f) => f.identifier === identifier)
}

export function isFeatureClientFeature(identifier: FeatureIdentifier): boolean {
  return !!clientFeatures().find((f) => f.identifier === identifier)
}
