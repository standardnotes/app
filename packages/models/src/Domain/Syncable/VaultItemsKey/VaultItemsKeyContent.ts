import { ProtocolVersion } from '@standardnotes/common'
import { ItemContent, SpecializedContent } from '../../Abstract/Content/ItemContent'

export interface VaultItemsKeyContentSpecialized extends SpecializedContent {
  version: ProtocolVersion
  keyTimestamp: number
  itemsKey: string
}

export type VaultItemsKeyContent = VaultItemsKeyContentSpecialized & ItemContent
