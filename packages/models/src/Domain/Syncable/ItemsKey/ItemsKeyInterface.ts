import { ProtocolVersion } from '@standardnotes/common'
import { DecryptedItemInterface } from './../../Abstract/Item/Interfaces/DecryptedItem'
import { ItemContent, SpecializedContent } from '../../Abstract/Content/ItemContent'

export interface ItemsKeyContentSpecialized extends SpecializedContent {
  version: ProtocolVersion
  isDefault?: boolean | undefined
  itemsKey: string
  dataAuthenticationKey?: string
}

export type ItemsKeyContent = ItemsKeyContentSpecialized & ItemContent

export interface ItemsKeyInterface extends DecryptedItemInterface<ItemsKeyContent> {
  get keyVersion(): ProtocolVersion
  get isDefault(): boolean | undefined
  get itemsKey(): string
  get dataAuthenticationKey(): string | undefined
}
