import { FeatureDescription } from '@standardnotes/features'
import { MinimalHttpResponse } from '../Http/MinimalHttpResponses'

export type GetOfflineFeaturesResponse = MinimalHttpResponse & {
  data?: {
    features: FeatureDescription[]
  }
}
