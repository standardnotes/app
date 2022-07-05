import { FeatureDescription } from '@standardnotes/features'

type ThirdPartyPackageInfo = {
  version: string
  download_url?: string
}

export type ComponentPackageInfo = FeatureDescription & Partial<ThirdPartyPackageInfo>
