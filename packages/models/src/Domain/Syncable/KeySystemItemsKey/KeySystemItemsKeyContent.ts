import { ProtocolVersion } from '@standardnotes/common'
import { ItemContent, SpecializedContent } from '../../Abstract/Content/ItemContent'

export interface KeySystemItemsKeyContentSpecialized extends SpecializedContent {
  version: ProtocolVersion
  keyTimestamp: number
  itemsKey: string
  rootKeyToken: string
}

export type KeySystemItemsKeyContent = KeySystemItemsKeyContentSpecialized & ItemContent
