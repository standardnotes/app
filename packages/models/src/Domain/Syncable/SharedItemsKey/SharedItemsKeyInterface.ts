import { ProtocolVersion } from '@standardnotes/common'
import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { ItemContent, SpecializedContent } from '../../Abstract/Content/ItemContent'

export interface SharedItemsKeyContentSpecialized extends SpecializedContent {
  version: ProtocolVersion
  itemsKey: string
}

export type SharedItemsKeyContent = SharedItemsKeyContentSpecialized & ItemContent

export interface SharedItemsKeyInterface extends DecryptedItemInterface<SharedItemsKeyContent> {
  get keyVersion(): ProtocolVersion
  get itemsKey(): string
}
