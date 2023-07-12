import { AnyFeatureDescription } from '@standardnotes/features'

export type GetOfflineFeaturesResponse = {
  features: AnyFeatureDescription[]
  roles: string[]
}
