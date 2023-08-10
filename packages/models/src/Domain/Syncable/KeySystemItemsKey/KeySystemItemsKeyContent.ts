import { ItemContent, SpecializedContent } from '../../Abstract/Content/ItemContent'
import { ProtocolVersion } from '../../Local/Protocol/ProtocolVersion'

export interface KeySystemItemsKeyContentSpecialized extends SpecializedContent {
  version: ProtocolVersion
  creationTimestamp: number
  itemsKey: string
  rootKeyToken: string
}

export type KeySystemItemsKeyContent = KeySystemItemsKeyContentSpecialized & ItemContent
