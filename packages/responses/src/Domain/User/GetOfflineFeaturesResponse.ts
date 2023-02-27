import { FeatureDescription } from '@standardnotes/features'
import { HttpResponse } from '../Http/HttpResponse'

export type GetOfflineFeaturesResponse = HttpResponse & {
  data?: {
    features: FeatureDescription[]
    roles: string[]
  }
}
