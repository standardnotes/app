import { FeatureDescription } from '@standardnotes/features'
import { HttpSuccessResponse } from '../Http/HttpResponse'

export type GetOfflineFeaturesResponse = HttpSuccessResponse<{
  features: FeatureDescription[]
  roles: string[]
}>
