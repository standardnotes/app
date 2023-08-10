import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { ProtocolVersion } from '../../Local/Protocol/ProtocolVersion'
import { KeySystemItemsKeyContent } from './KeySystemItemsKeyContent'

export interface KeySystemItemsKeyInterface extends DecryptedItemInterface<KeySystemItemsKeyContent> {
  readonly creationTimestamp: number
  readonly rootKeyToken: string

  get keyVersion(): ProtocolVersion
  get itemsKey(): string
}
