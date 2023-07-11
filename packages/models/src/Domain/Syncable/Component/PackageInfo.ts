import { ComponentFeatureDescription, ThemeFeatureDescription } from '@standardnotes/features'

type ThirdPartyPackageInfo = {
  version: string
  download_url?: string
}

export type ComponentPackageInfo = ComponentFeatureDescription & Partial<ThirdPartyPackageInfo>
export type ThemePackageInfo = ThemeFeatureDescription & Partial<ThirdPartyPackageInfo> & ThemeFeatureDescription
