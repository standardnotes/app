import { ComponentFeatureDescription } from './ComponentFeatureDescription'

export type ThirdPartyFeatureDescription = ComponentFeatureDescription & {
  url: string
  version: string
  download_url?: string
}
