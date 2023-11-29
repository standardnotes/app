import { ThirdPartyFeatureDescription } from '@standardnotes/features'

export type PluginListing = ThirdPartyFeatureDescription & {
  publisher: string
  base64Hash: string
  binaryHash: string
  showInGallery: boolean
}

export type PluginsList = PluginListing[]
