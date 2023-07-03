import { InternalFeature } from './InternalFeature'

export interface InternalFeatureServiceInterface {
  isFeatureEnabled(feature: InternalFeature): boolean
  enableFeature(feature: InternalFeature): void
}
