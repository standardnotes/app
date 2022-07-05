import { FeatureDescription } from './FeatureDescription'
import { FeatureIdentifier } from './FeatureIdentifier'
import { editors } from '../Lists/Editors'
import { themes } from '../Lists/Themes'
import { serverFeatures } from '../Lists/ServerFeatures'
import { clientFeatures } from '../Lists/ClientFeatures'
import { GetDeprecatedFeatures } from '../Lists/DeprecatedFeatures'
import { experimentalFeatures } from '../Lists/ExperimentalFeatures'
import { SubscriptionName } from '@standardnotes/common'

export function GetFeatures(): FeatureDescription[] {
  return [
    ...themes(),
    ...editors(),
    ...serverFeatures(),
    ...clientFeatures(),
    ...experimentalFeatures(),
    ...GetDeprecatedFeatures(),
  ]
}

export function GetFeaturesForSubscription(subscription: SubscriptionName): FeatureDescription[] {
  return GetFeatures().filter((feature) => feature.availableInSubscriptions.includes(subscription))
}

export function FindNativeFeature(identifier: FeatureIdentifier): FeatureDescription | undefined {
  return GetFeatures().find((f) => f.identifier === identifier)
}
