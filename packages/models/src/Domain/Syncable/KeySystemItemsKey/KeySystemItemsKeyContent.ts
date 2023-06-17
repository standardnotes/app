import { ProtocolVersion } from '@standardnotes/common'
import { ItemContent, SpecializedContent } from '../../Abstract/Content/ItemContent'

export interface KeySystemItemsKeyContentSpecialized extends SpecializedContent {
  version: ProtocolVersion
  creationTimestamp: number
  itemsKey: string
  rootKeyToken: string
}

export type KeySystemItemsKeyContent = KeySystemItemsKeyContentSpecialized & ItemContent
