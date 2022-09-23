import { FeatureDescription, ThemeFeatureDescription } from '@standardnotes/features'

type ThirdPartyPackageInfo = {
  version: string
  download_url?: string
}

export type ComponentPackageInfo = FeatureDescription & Partial<ThirdPartyPackageInfo>
export type ThemePackageInfo = FeatureDescription & Partial<ThirdPartyPackageInfo> & ThemeFeatureDescription
