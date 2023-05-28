import { ProtocolVersion } from '@standardnotes/common'
import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { ItemContent, SpecializedContent } from '../../Abstract/Content/ItemContent'

export interface VaultItemsKeyContentSpecialized extends SpecializedContent {
  version: ProtocolVersion
  itemsKey: string
}

export type VaultItemsKeyContent = VaultItemsKeyContentSpecialized & ItemContent

export interface VaultItemsKeyInterface extends DecryptedItemInterface<VaultItemsKeyContent> {
  get keyVersion(): ProtocolVersion
  get itemsKey(): string
}
