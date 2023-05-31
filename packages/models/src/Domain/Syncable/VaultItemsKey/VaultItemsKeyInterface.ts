import { ProtocolVersion } from '@standardnotes/common'
import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { VaultItemsKeyContent } from './VaultItemsKeyContent'

export interface VaultItemsKeyInterface extends DecryptedItemInterface<VaultItemsKeyContent> {
  readonly keyTimestamp: number

  get keyVersion(): ProtocolVersion
  get itemsKey(): string
}
