import { FeatureDescription } from '@standardnotes/features'
import { DeprecatedMinimalHttpResponse } from '../Http/DeprecatedMinimalHttpResponses'

export type GetOfflineFeaturesResponse = DeprecatedMinimalHttpResponse & {
  data?: {
    features: FeatureDescription[]
    roles: string[]
  }
}
